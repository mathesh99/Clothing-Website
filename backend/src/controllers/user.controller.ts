import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import bcrypt from 'bcryptjs';

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6),
  country: z.string().default('India'),
  isDefault: z.boolean().optional(),
});

export const userController = {
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true },
      });
      if (!user) throw new NotFoundError('User not found');
      sendSuccess(res, user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, phone } = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
      }).parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { firstName, lastName, phone },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true },
      });
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }).parse(req.body);

      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) throw new NotFoundError('User not found');

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new Error('Current password is incorrect');

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId: req.user!.userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      sendSuccess(res, addresses, 'Addresses retrieved');
    } catch (err) {
      next(err);
    }
  },

  async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = addressSchema.parse(req.body);

      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.userId },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: { ...data, userId: req.user!.userId },
      });
      sendSuccess(res, address, 'Address added', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await prisma.address.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!address) throw new NotFoundError('Address not found');

      const data = addressSchema.partial().parse(req.body);

      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user!.userId },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.address.update({ where: { id: req.params.id }, data });
      sendSuccess(res, updated, 'Address updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await prisma.address.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!address) throw new NotFoundError('Address not found');
      await prisma.address.delete({ where: { id: req.params.id } });
      sendSuccess(res, null, 'Address deleted');
    } catch (err) {
      next(err);
    }
  },
};
