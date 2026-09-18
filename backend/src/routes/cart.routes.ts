import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { optionalAuth, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, cartController.getCart);
router.post('/items', optionalAuth, cartController.addItem);
router.patch('/items/:itemId', authenticate, cartController.updateItem);
router.delete('/items/:itemId', authenticate, cartController.removeItem);
router.post('/merge', authenticate, cartController.mergeGuestCart);

export default router;
