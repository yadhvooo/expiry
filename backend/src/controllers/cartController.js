import db from '../config/db.js';
import { isProductSellable } from '../services/expiryService.js';

/**
 * Validate Cart Items against DB prices, provider consistency, and expiry
 */
export async function validateCart(req, res) {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({
        isValid: true,
        items: [],
        subtotal: 0,
        platformFee: 0,
        total: 0,
        provider: null
      });
    }

    const productIds = items.map((i) => i.productId);
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(',');
    const dbProducts = await db.query(
      `SELECT p.*, pr.id AS provider_id, pr.business_name AS provider_name, pr.address AS provider_address
       FROM products p
       JOIN providers pr ON p.provider_id = pr.id
       WHERE p.id IN (${placeholders})`,
      productIds
    );

    if (dbProducts.length === 0) {
      return res.status(400).json({ error: 'Cart items no longer exist in catalog.' });
    }

    // Check multi-provider rule
    const firstProvider = {
      id: dbProducts[0].provider_id,
      name: dbProducts[0].provider_name,
      address: dbProducts[0].provider_address
    };

    const hasDifferentProvider = dbProducts.some((p) => p.provider_id !== firstProvider.id);
    if (hasDifferentProvider) {
      return res.status(400).json({
        error: 'Multi-provider conflict: You cannot combine items from different food providers in a single pickup order.',
        multiProvider: true
      });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const p = dbProducts.find((dbP) => dbP.id === item.productId);
      if (!p) continue;

      const requestedQty = Math.min(parseInt(item.quantity, 10) || 1, p.quantity);
      const isSellable = isProductSellable(p.expiry_date || p.best_before_date, p.quantity);

      if (!isSellable) {
        return res.status(400).json({
          error: `Item "${p.name}" has expired or is out of stock.`
        });
      }

      const unitPrice = parseFloat(p.discounted_price);
      const itemSubtotal = unitPrice * requestedQty;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: p.id,
        name: p.name,
        originalPrice: parseFloat(p.original_price),
        discountedPrice: unitPrice,
        discountPercent: parseFloat(p.discount_percent),
        quantity: requestedQty,
        availableStock: p.quantity,
        subtotal: itemSubtotal
      });
    }

    const platformFee = 5.00;
    const total = Math.round((subtotal + platformFee) * 100) / 100;

    return res.json({
      isValid: true,
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      platformFee,
      total,
      provider: firstProvider
    });
  } catch (error) {
    console.error('[Cart] ValidateCart error:', error);
    return res.status(500).json({ error: 'Failed to validate cart.' });
  }
}

export default {
  validateCart
};
