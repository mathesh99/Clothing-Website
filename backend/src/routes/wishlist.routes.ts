import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', adminController.getWishlist);
router.post('/items', adminController.addToWishlist);
router.delete('/items/:productId', adminController.removeFromWishlist);

export default router;
