import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';

const router = Router();
router.get('/', adminController.getCategories);
export default router;
