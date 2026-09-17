import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { classifyExpiry, calculateDaysRemaining } from '../services/expiryService.js';
import { calculateRecommendedDiscount, computeDiscountedPrice } from '../services/autoDiscountService.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Helper to retrieve provider record for the logged-in user
 */
async function getProviderForUser(userId) {
  const providers = await db.query('SELECT * FROM providers WHERE user_id = $1', [userId]);
  return providers.length > 0 ? providers[0] : null;
}

/**
 * Provider Dashboard Overview Metrics
 */
export async function getProviderDashboard(req, res) {
  try {
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found.' });
    }

    // Active listings
    const products = await db.query(
      'SELECT * FROM products WHERE provider_id = $1 AND is_active = 1',
      [provider.id]
    );

    let approachingCount = 0;
    let urgentCount = 0;
    for (const p of products) {
      const cls = classifyExpiry(p.expiry_date || p.best_before_date);
      if (cls.status === 'APPROACHING') approachingCount++;
      if (cls.status === 'URGENT') urgentCount++;
    }

    // Orders metrics
    const orders = await db.query(
      'SELECT * FROM orders WHERE provider_id = $1',
      [provider.id]
    );

    const pendingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'READY_FOR_PICKUP').length;
    const completedOrders = orders.filter((o) => o.status === 'PICKED_UP').length;

    // Rescued quantity and sales calculation
    const pickedUpOrders = orders.filter((o) => o.status === 'PICKED_UP');
    let totalRescueSales = 0;
    for (const ord of pickedUpOrders) {
      totalRescueSales += parseFloat(ord.subtotal || 0);
    }

    const orderItems = await db.query(
      `SELECT oi.* 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.provider_id = $1 AND o.status = 'PICKED_UP'`,
      [provider.id]
    );

    let productsRescuedCount = 0;
    let totalOriginalValue = 0;
    for (const item of orderItems) {
      productsRescuedCount += item.quantity;
      totalOriginalValue += parseFloat(item.unit_original_price) * item.quantity;
    }

    return res.json({
      provider: {
        id: provider.id,
        businessName: provider.business_name,
        status: provider.status,
        autoDiscountEnabled: Boolean(provider.auto_discount_enabled)
      },
      metrics: {
        todayRescueSales: Math.round(totalRescueSales * 100) / 100,
        productsRescued: productsRescuedCount,
        revenueRecovered: Math.round(totalRescueSales * 100) / 100,
        foodValueSaved: Math.round(totalOriginalValue * 100) / 100,
        activeListings: products.length,
        approachingExpiry: approachingCount,
        urgentExpiry: urgentCount,
        pendingOrders,
        completedOrders
      }
    });
  } catch (error) {
    console.error('[Provider] GetDashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch provider dashboard metrics.' });
  }
}

/**
 * Get all products listed by this provider
 */
export async function getProviderProducts(req, res) {
  try {
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found.' });
    }

    const rows = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
       (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image_url
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.provider_id = $1
       ORDER BY p.created_at DESC`,
      [provider.id]
    );

    const products = rows.map((p) => {
      const cls = classifyExpiry(p.expiry_date || p.best_before_date);
      const recommended = calculateRecommendedDiscount(p.expiry_date || p.best_before_date, p.original_price);
      return {
        ...p,
        expiry_status: cls.status,
        expiry_badge: cls.badge,
        days_remaining: cls.daysRemaining,
        is_sellable: cls.isSellable,
        recommended_discount: recommended.recommendedPercent
      };
    });

    return res.json({ products });
  } catch (error) {
    console.error('[Provider] GetProviderProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch provider products.' });
  }
}

/**
 * Add a new product listing with auto-discount calculator
 */
export async function createProduct(req, res) {
  try {
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found.' });
    }

    if (provider.status !== 'approved') {
      return res.status(403).json({
        error: `Account status is '${provider.status}'. Products can only be listed once approved by Admin.`
      });
    }

    const {
      name,
      categoryId,
      description,
      imageUrl,
      mrp,
      originalPrice,
      discountPercent,
      quantity,
      bestBeforeDate,
      expiryDate,
      storageInstructions,
      pickupStartTime = '10:00',
      pickupEndTime = '21:00',
      autoDiscount = true
    } = req.body;

    if (!name || !categoryId || !originalPrice || !quantity || !bestBeforeDate) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Check food safety: Do not allow adding product that has already expired!
    const effectiveExpiry = expiryDate || bestBeforeDate;
    const days = calculateDaysRemaining(effectiveExpiry);
    if (days < 0) {
      return res.status(400).json({
        error: 'Food Safety Policy Violation: Cannot list food products that have already passed their expiry or best-before date.'
      });
    }

    // Calculate discount percent and price
    let finalDiscountPercent = parseFloat(discountPercent) || 0;
    if (autoDiscount) {
      const rec = calculateRecommendedDiscount(effectiveExpiry, originalPrice);
      if (rec.recommendedPercent > 0 && finalDiscountPercent === 0) {
        finalDiscountPercent = rec.recommendedPercent;
      }
    }

    const discountedPrice = computeDiscountedPrice(originalPrice, finalDiscountPercent);

    const productId = uuidv4();
    await db.query(
      `INSERT INTO products (
        id, provider_id, category_id, name, description,
        mrp, original_price, discount_percent, discounted_price,
        quantity, best_before_date, expiry_date, storage_instructions,
        pickup_start_time, pickup_end_time, is_active, auto_discount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1, $16)`,
      [
        productId,
        provider.id,
        categoryId,
        name,
        description || '',
        mrp || originalPrice,
        originalPrice,
        finalDiscountPercent,
        discountedPrice,
        parseInt(quantity, 10),
        bestBeforeDate,
        effectiveExpiry,
        storageInstructions || 'Store in cool and dry place',
        pickupStartTime,
        pickupEndTime,
        autoDiscount ? 1 : 0
      ]
    );

    // Save product image
    const imageId = uuidv4();
    await db.query(
      `INSERT INTO product_images (id, product_id, image_url, is_primary)
       VALUES ($1, $2, $3, 1)`,
      [
        imageId,
        productId,
        imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
      ]
    );

    // Initialize inventory record
    const inventoryId = uuidv4();
    await db.query(
      `INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity)
       VALUES ($1, $2, $3, 0, 0)`,
      [inventoryId, productId, parseInt(quantity, 10)]
    );

    return res.status(201).json({
      message: 'Product listing created successfully.',
      productId,
      discountedPrice,
      discountPercent: finalDiscountPercent
    });
  } catch (error) {
    console.error('[Provider] CreateProduct error:', error);
    return res.status(500).json({ error: 'Failed to create product listing.' });
  }
}

/**
 * Edit existing product
 */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const {
      name,
      categoryId,
      description,
      originalPrice,
      discountPercent,
      quantity,
      bestBeforeDate,
      expiryDate,
      storageInstructions,
      pickupStartTime,
      pickupEndTime,
      isActive
    } = req.body;

    const existing = await db.query(
      'SELECT * FROM products WHERE id = $1 AND provider_id = $2',
      [id, provider.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    const current = existing[0];
    const newOrigPrice = originalPrice !== undefined ? parseFloat(originalPrice) : current.original_price;
    const newDiscount = discountPercent !== undefined ? parseFloat(discountPercent) : current.discount_percent;
    const discountedPrice = computeDiscountedPrice(newOrigPrice, newDiscount);

    await db.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        description = COALESCE($3, description),
        original_price = $4,
        discount_percent = $5,
        discounted_price = $6,
        quantity = COALESCE($7, quantity),
        best_before_date = COALESCE($8, best_before_date),
        expiry_date = COALESCE($9, expiry_date),
        storage_instructions = COALESCE($10, storage_instructions),
        pickup_start_time = COALESCE($11, pickup_start_time),
        pickup_end_time = COALESCE($12, pickup_end_time),
        is_active = COALESCE($13, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND provider_id = $15`,
      [
        name,
        categoryId,
        description,
        newOrigPrice,
        newDiscount,
        discountedPrice,
        quantity !== undefined ? parseInt(quantity, 10) : null,
        bestBeforeDate,
        expiryDate,
        storageInstructions,
        pickupStartTime,
        pickupEndTime,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id,
        provider.id
      ]
    );

    return res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('[Provider] UpdateProduct error:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
}

/**
 * Delete / deactivate product
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    await db.query('UPDATE products SET is_active = 0 WHERE id = $1 AND provider_id = $2', [
      id,
      provider.id
    ]);

    return res.json({ message: 'Product listing removed from marketplace.' });
  } catch (error) {
    console.error('[Provider] DeleteProduct error:', error);
    return res.status(500).json({ error: 'Failed to remove product.' });
  }
}

/**
 * Get Provider Orders
 */
export async function getProviderOrders(req, res) {
  try {
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const orders = await db.query(
      `SELECT o.* 
       FROM orders o 
       WHERE o.provider_id = $1 
       ORDER BY o.created_at DESC`,
      [provider.id]
    );

    for (const ord of orders) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [ord.id]);
      ord.items = items;
    }

    return res.json({ orders });
  } catch (error) {
    console.error('[Provider] GetProviderOrders error:', error);
    return res.status(500).json({ error: 'Failed to fetch provider orders.' });
  }
}

/**
 * Update Order Status (Accept, Mark Ready, Cancel)
 */
export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const provider = await getProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const allowed = ['CONFIRMED', 'READY_FOR_PICKUP', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid status update. Allowed provider transitions: ${allowed.join(', ')}`
      });
    }

    const orders = await db.query(
      `SELECT o.*, c.user_id AS customer_user_id 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = $1 AND o.provider_id = $2`,
      [id, provider.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found for this provider.' });
    }

    const order = orders[0];
    if (order.status === 'PICKED_UP') {
      return res.status(400).json({ error: 'Cannot change status of already completed order.' });
    }

    await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    // Notify customer
    let msg = `Your order ${order.order_number} is now ${status.replace(/_/g, ' ')}.`;
    if (status === 'READY_FOR_PICKUP') {
      msg = `Great news! Your order ${order.order_number} is packed and READY FOR PICKUP at ${provider.business_name}. Pickup Code: ${order.pickup_code}`;
    }
    await createNotification({
      userId: order.customer_user_id,
      title: `Order Update (${order.order_number})`,
      message: msg,
      type: 'order_update',
      linkUrl: '/orders'
    });

    return res.json({ message: `Order status updated to ${status}.` });
  } catch (error) {
    console.error('[Provider] UpdateOrderStatus error:', error);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

export default {
  getProviderDashboard,
  getProviderProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProviderOrders,
  updateOrderStatus
};
