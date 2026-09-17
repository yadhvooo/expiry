import express from 'express';
import { getProducts, getProductById, getCategories } from '../controllers/productController.js';
import { validateCart } from '../controllers/cartController.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/search', getProducts);
router.get('/nearby', getProducts);
router.post('/cart/validate', validateCart);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
