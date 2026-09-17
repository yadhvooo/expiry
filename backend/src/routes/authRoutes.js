import express from 'express';
import { registerCustomer, registerProvider, login, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/register/customer', registerCustomer);
router.post('/register/provider', registerProvider);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

export default router;
