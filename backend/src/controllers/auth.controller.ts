import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { otpService } from '../services/otp.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  async sendRegistrationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const result = await otpService.sendRegistrationOtp(email);
      sendSuccess(res, result, 'OTP sent to email');
    } catch (err) {
      next(err);
    }
  },

  async verifyRegistrationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = z.object({ email: z.string().email(), otp: z.string().min(6) }).parse(req.body);
      const result = await otpService.verifyOtp(email, otp);
      sendSuccess(res, result, 'Email verified');
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      
      // Enforce OTP verification before allowing registration
      const verification = await prisma.otpVerification.findFirst({
        where: { email: data.email, isVerified: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!verification) {
        return res.status(400).json({ success: false, message: 'Email not verified. Please verify your email first.' });
      }

      const result = await authService.register(data);
      sendSuccess(res, result, 'Account created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      sendSuccess(res, result, 'Logged in successfully');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
      }
      const tokens = await authService.refresh(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) await authService.logout(req.user.userId);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      await authService.forgotPassword(email);
      sendSuccess(res, null, 'If this email exists, a reset link has been sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = z.object({
        token: z.string().min(1),
        password: z.string().min(8),
      }).parse(req.body);
      await authService.resetPassword(token, password);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },
};
