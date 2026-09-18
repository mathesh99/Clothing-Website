import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  couponCode: z.string().optional(),
  shippingMethod: z.string().optional(),
});

export const orderController = {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(req.user!.userId, data);
      sendSuccess(res, order, 'Order created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async getMyOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await orderService.getUserOrders(req.user!.userId, page, limit);
      sendSuccess(res, result.orders, 'Orders retrieved', 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user!.userId);
      sendSuccess(res, order, 'Order retrieved');
    } catch (err) {
      next(err);
    }
  },
};
