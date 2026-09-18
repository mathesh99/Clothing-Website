import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export const paymentController = {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.createRazorpayOrder(orderId, req.user!.userId);
      sendSuccess(res, result, 'Payment order created');
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const result = await paymentService.verifyPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      sendSuccess(res, result, 'Payment verified successfully');
    } catch (err) {
      next(err);
    }
  },

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);
      await paymentService.handleWebhook(body, signature);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  },
};
