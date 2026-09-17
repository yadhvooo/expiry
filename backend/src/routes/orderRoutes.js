import express from 'express';
import { createOrder, getCustomerOrders, getOrderById } from '../controllers/orderController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getCustomerOrders);
router.get('/:id', verifyToken, getOrderById);

export default router;
