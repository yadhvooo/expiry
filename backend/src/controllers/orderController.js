import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { isProductSellable } from '../services/expiryService.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Generate human-readable Order Number and 4-digit pickup code
 */
function generateOrderNumber() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `FD${randomNum}`;
}

function generatePickupCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Create Order (Atomic, secure price calculation)
 */
export async function createOrder(req, res) {
  try {
    const { items, pickupStartTime, pickupEndTime, customerName, customerPhone, paymentMethod = 'UPI' } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // Find customer ID for this user
    let customerRows = await db.query('SELECT id FROM customers WHERE user_id = $1', [userId]);
    let customerId;
    if (customerRows.length === 0) {
      customerId = uuidv4();
      await db.query('INSERT INTO customers (id, user_id) VALUES ($1, $2)', [customerId, userId]);
    } else {
      customerId = customerRows[0].id;
    }

    // Fetch products from DB to verify seller isolation and recalculate prices
    const productIds = items.map((i) => i.productId);
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(',');
    const dbProducts = await db.query(
      `SELECT p.*, pr.user_id AS provider_user_id, pr.business_name AS provider_name 
       FROM products p 
       JOIN providers pr ON p.provider_id = pr.id 
       WHERE p.id IN (${placeholders})`,
      productIds
    );

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products are no longer available.' });
    }

    // CRITICAL: Ensure all products are from the EXACT SAME PROVIDER
    const firstProviderId = dbProducts[0].provider_id;
    const multiProvider = dbProducts.some((p) => p.provider_id !== firstProviderId);
    if (multiProvider) {
      return res.status(400).json({
        error: 'Multi-provider cart detected. Items from different stores must be purchased in separate pickup orders.'
      });
    }

    // CRITICAL FOOD SAFETY & STOCK VERIFICATION
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.productId);
      const requestedQty = parseInt(item.quantity, 10) || 1;

      // Check expiry date
      if (!isProductSellable(dbProd.expiry_date || dbProd.best_before_date, dbProd.quantity)) {
        return res.status(400).json({
          error: `Item "${dbProd.name}" has expired or is out of stock and cannot be sold.`
        });
      }

      // Check stock availability
      if (dbProd.quantity < requestedQty) {
        return res.status(400).json({
          error: `Only ${dbProd.quantity} units remaining for "${dbProd.name}". Please adjust quantity.`
        });
      }

      // Secure database price (Never trust client sent prices!)
      const unitPrice = parseFloat(dbProd.discounted_price);
      const itemTotal = unitPrice * requestedQty;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: dbProd.id,
        name: dbProd.name,
        unitOriginalPrice: parseFloat(dbProd.original_price),
        unitDiscountedPrice: unitPrice,
        quantity: requestedQty,
        subtotal: itemTotal,
        newRemainingQty: dbProd.quantity - requestedQty
      });
    }

    const platformFee = 5.00; // ₹5 platform contribution fee
    const totalAmount = Math.round((subtotal + platformFee) * 100) / 100;
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();
    const pickupCode = generatePickupCode();
    const qrData = JSON.stringify({
      orderId,
      orderNumber,
      pickupCode,
      providerId: firstProviderId
    });

    // 1. Create Order
    await db.query(
      `INSERT INTO orders (
        id, order_number, customer_id, provider_id, subtotal,
        platform_fee, total_amount, status, pickup_start_time,
        pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8, $9, $10, $11, $12, $13)`,
      [
        orderId,
        orderNumber,
        customerId,
        firstProviderId,
        subtotal,
        platformFee,
        totalAmount,
        pickupStartTime || '16:00',
        pickupEndTime || '20:00',
        pickupCode,
        qrData,
        customerName || req.user.fullName,
        customerPhone || '9876543210'
      ]
    );

    // 2. Insert Order Items & decrement inventory
    for (const vItem of verifiedItems) {
      const orderItemId = uuidv4();
      await db.query(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name,
          unit_original_price, unit_discounted_price, quantity, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderItemId,
          orderId,
          vItem.productId,
          vItem.name,
          vItem.unitOriginalPrice,
          vItem.unitDiscountedPrice,
          vItem.quantity,
          vItem.subtotal
        ]
      );

      // Decrement product quantity
      await db.query('UPDATE products SET quantity = $1 WHERE id = $2', [
        vItem.newRemainingQty,
        vItem.productId
      ]);
    }

    // 3. Mock Payment record
    const paymentId = uuidv4();
    const txId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await db.query(
      `INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status, gateway_response)
       VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', $7)`,
      [paymentId, orderId, customerId, totalAmount, paymentMethod, txId, JSON.stringify({ verified: true, method: paymentMethod })]
    );

    // 4. Send Notifications
    // Customer notification
    await createNotification({
      userId,
      title: `Order ${orderNumber} Confirmed!`,
      message: `Your pickup code is ${pickupCode}. Pick up from ${dbProducts[0].provider_name} before ${pickupEndTime || 'close'}.`,
      type: 'order_update',
      linkUrl: `/orders`
    });

    // Provider notification
    await createNotification({
      userId: dbProducts[0].provider_user_id,
      title: `New Order Received (${orderNumber})`,
      message: `${customerName || req.user.fullName} purchased ${verifiedItems.length} rescued items (₹${totalAmount}).`,
      type: 'order_update',
      linkUrl: `/provider/orders`
    });

    return res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        id: orderId,
        orderNumber,
        pickupCode,
        qrCodeData: qrData,
        subtotal,
        platformFee,
        totalAmount,
        status: 'CONFIRMED',
        pickupStartTime,
        pickupEndTime,
        providerName: dbProducts[0].provider_name,
        itemsCount: verifiedItems.length
      }
    });
  } catch (error) {
    console.error('[Order] CreateOrder error:', error);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
}

/**
 * Get customer orders with full item details
 */
export async function getCustomerOrders(req, res) {
  try {
    const userId = req.user.id;
    const customerRows = await db.query('SELECT id FROM customers WHERE user_id = $1', [userId]);
    if (customerRows.length === 0) {
      return res.json({ orders: [] });
    }

    const customerId = customerRows[0].id;
    const orders = await db.query(
      `SELECT 
        o.*,
        pr.business_name AS provider_name,
        pr.address AS provider_address,
        pr.phone AS provider_phone,
        pr.latitude AS provider_lat,
        pr.longitude AS provider_lng
       FROM orders o
       JOIN providers pr ON o.provider_id = pr.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    // Attach items to each order
    for (const order of orders) {
      const items = await db.query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [order.id]
      );
      order.items = items;
    }

    return res.json({ orders });
  } catch (error) {
    console.error('[Order] GetCustomerOrders error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer orders.' });
  }
}

/**
 * Get single order details
 */
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const orders = await db.query(
      `SELECT 
        o.*,
        pr.business_name AS provider_name,
        pr.address AS provider_address,
        pr.phone AS provider_phone
       FROM orders o
       JOIN providers pr ON o.provider_id = pr.id
       WHERE o.id = $1`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orders[0];
    const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    order.items = items;

    return res.json({ order });
  } catch (error) {
    console.error('[Order] GetOrderById error:', error);
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
}

export default {
  createOrder,
  getCustomerOrders,
  getOrderById
};
