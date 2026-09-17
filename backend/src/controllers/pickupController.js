import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Verify pickup via 4-digit code or scanned QR code data
 */
export async function verifyPickup(req, res) {
  try {
    const { code, qrData, orderId: explicitOrderId, notes } = req.body;
    const providerUser = req.user;

    // Retrieve provider record
    const providers = await db.query('SELECT * FROM providers WHERE user_id = $1', [providerUser.id]);
    if (providers.length === 0) {
      return res.status(403).json({ error: 'Only registered providers can verify pickups.' });
    }
    const provider = providers[0];

    let lookupCode = code ? String(code).trim() : null;
    let targetOrderId = explicitOrderId;

    // If QR data is scanned, parse JSON payload
    if (qrData) {
      try {
        const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        if (parsed.pickupCode) lookupCode = String(parsed.pickupCode).trim();
        if (parsed.orderId) targetOrderId = parsed.orderId;
      } catch (err) {
        // Raw string might just be the pickup code
        lookupCode = String(qrData).trim();
      }
    }

    if (!lookupCode && !targetOrderId) {
      return res.status(400).json({ error: 'Please enter the 4-digit pickup code or scan the customer QR code.' });
    }

    // Query order for this provider
    let querySql = `
      SELECT o.*, c.user_id AS customer_user_id 
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.provider_id = $1
    `;
    const params = [provider.id];

    if (lookupCode) {
      params.push(lookupCode);
      querySql += ` AND o.pickup_code = $${params.length}`;
    }
    if (targetOrderId) {
      params.push(targetOrderId);
      querySql += ` AND o.id = $${params.length}`;
    }

    const orders = await db.query(querySql, params);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'No matching order found for this provider with the supplied pickup code.'
      });
    }

    const order = orders[0];

    // VERIFICATION 1: Correct Provider (Guaranteed by WHERE o.provider_id = $1)

    // VERIFICATION 2: Order not already collected
    if (order.status === 'PICKED_UP') {
      const verifications = await db.query(
        'SELECT * FROM pickup_verifications WHERE order_id = $1',
        [order.id]
      );
      const verifiedTime = verifications.length > 0 ? verifications[0].verified_at : 'previously';
      return res.status(409).json({
        error: `Security Alert: This order was ALREADY PICKED UP at ${verifiedTime}. Cannot be claimed twice!`,
        alreadyCollected: true,
        orderNumber: order.order_number
      });
    }

    // VERIFICATION 3: Check Payment Completed
    const payments = await db.query(
      'SELECT * FROM payments WHERE order_id = $1 AND status = $2',
      [order.id, 'COMPLETED']
    );
    if (payments.length === 0) {
      return res.status(400).json({
        error: 'Pickup blocked: Payment has not been completed for this order.'
      });
    }

    // VERIFICATION 4: Mark PICKED UP and record verification
    await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['PICKED_UP', order.id]
    );

    const verificationId = uuidv4();
    await db.query(
      `INSERT INTO pickup_verifications (
        id, order_id, provider_id, verified_by_user_id,
        verified_code, verification_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        verificationId,
        order.id,
        provider.id,
        providerUser.id,
        lookupCode || order.pickup_code,
        qrData ? 'QR_SCAN' : 'CODE',
        notes || 'Verified at store counter'
      ]
    );

    // Fetch order items to show summary
    const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

    // Send confirmation notification to customer
    await createNotification({
      userId: order.customer_user_id,
      title: `Order ${order.order_number} Collected!`,
      message: `Thank you for rescuing food with ${provider.business_name}! Enjoy your meal.`,
      type: 'order_update',
      linkUrl: '/orders'
    });

    return res.json({
      success: true,
      message: `Order #${order.order_number} verified and marked as PICKED UP!`,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: 'PICKED_UP',
        customerName: order.customer_name,
        totalAmount: order.total_amount,
        items
      }
    });
  } catch (error) {
    console.error('[Pickup] VerifyPickup error:', error);
    return res.status(500).json({ error: 'Pickup verification failed.' });
  }
}

export default {
  verifyPickup
};
