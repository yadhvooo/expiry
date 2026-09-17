import express from 'express';
import {
  getProviderDashboard,
  getProviderProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProviderOrders,
  updateOrderStatus
} from '../controllers/providerController.js';
import { verifyPickup } from '../controllers/pickupController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All provider endpoints require provider role
router.use(verifyToken, requireRole('provider', 'admin'));

router.get('/dashboard', getProviderDashboard);
router.get('/products', getProviderProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getProviderOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/pickup/verify', verifyPickup);

export default router;
