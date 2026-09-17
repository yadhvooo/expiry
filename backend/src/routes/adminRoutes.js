import express from 'express';
import {
  getAdminAnalytics,
  getAdminProviders,
  updateProviderStatus,
  getAdminUsers,
  updateUserStatus,
  getAdminProducts,
  toggleProductStatus,
  getAdminOrders,
  refundOrder
} from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/analytics', getAdminAnalytics);
router.get('/providers', getAdminProviders);
router.put('/providers/:id/status', updateProviderStatus);
router.put('/providers/:id/approve', (req, res, next) => {
  req.body.status = 'approved';
  updateProviderStatus(req, res, next);
});
router.get('/users', getAdminUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/products', getAdminProducts);
router.put('/products/:id/toggle', toggleProductStatus);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/refund', refundOrder);

export default router;
