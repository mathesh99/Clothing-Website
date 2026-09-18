import { Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export const cartController = {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const guestId = req.headers['x-guest-id'] as string;
      const cart = await cartService.getCart(req.user?.userId, guestId);
      sendSuccess(res, cart, 'Cart retrieved');
    } catch (err) {
      next(err);
    }
  },

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { variantId, quantity = 1 } = req.body;
      const guestId = req.headers['x-guest-id'] as string;
      const cart = await cartService.addItem(req.user?.userId, guestId, variantId, Number(quantity));
      sendSuccess(res, cart, 'Item added to cart');
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const guestId = req.headers['x-guest-id'] as string;
      const cart = await cartService.updateItem(req.params.itemId as string, req.user?.userId, guestId, Number(quantity));
      sendSuccess(res, cart, 'Cart updated');
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const guestId = req.headers['x-guest-id'] as string;
      const cart = await cartService.removeItem(req.params.itemId as string, req.user?.userId, guestId);
      sendSuccess(res, cart, 'Item removed from cart');
    } catch (err) {
      next(err);
    }
  },

  async mergeGuestCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { guestId } = req.body;
      if (req.user && guestId) {
        await cartService.mergeGuestCart(req.user.userId, guestId);
      }
      const cart = await cartService.getCart(req.user?.userId);
      sendSuccess(res, cart, 'Cart merged');
    } catch (err) {
      next(err);
    }
  },
};
