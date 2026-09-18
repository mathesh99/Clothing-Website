import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Products
router.get('/products', adminController.getAdminProducts);
router.get('/products/:id', adminController.getAdminProduct);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.post('/products/:id/images', upload.array('images', 10), adminController.uploadProductImages);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Clothing Types
router.get('/clothing-types', adminController.getClothingTypes);
router.post('/clothing-types', adminController.saveClothingTypes);

// Site Content
router.get('/site-content', adminController.getSiteContent);
router.put('/site-content', adminController.saveSiteContent);


// Inventory
router.get('/inventory', adminController.getInventory);
router.patch('/inventory/:variantId/stock', adminController.updateStock);

// Orders
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderDetail);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Customers
router.get('/customers', adminController.getCustomers);
router.patch('/customers/:id/toggle-status', adminController.toggleCustomerStatus);

// Reviews
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);

export default router;
