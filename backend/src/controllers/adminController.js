import db from '../config/db.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Admin Analytics Overview
 */
export async function getAdminAnalytics(req, res) {
  try {
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const providerCount = await db.query('SELECT COUNT(*) as count FROM providers');
    const productCount = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const orderCount = await db.query('SELECT COUNT(*) as count FROM orders');

    const orders = await db.query('SELECT * FROM orders WHERE status != $1', ['CANCELLED']);
    let gtv = 0;
    let platformRevenue = 0;
    for (const ord of orders) {
      gtv += parseFloat(ord.total_amount || 0);
      platformRevenue += parseFloat(ord.platform_fee || 5);
    }

    const orderItems = await db.query(
      `SELECT oi.* 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'CANCELLED'`
    );

    let productsRescued = 0;
    let foodValueRescued = 0;
    for (const item of orderItems) {
      productsRescued += item.quantity;
      foodValueRescued += parseFloat(item.unit_original_price) * item.quantity;
    }

    // Popular categories
    const popularCategories = await db.query(
      `SELECT c.name, COUNT(oi.id) as sales_count, SUM(oi.subtotal) as total_sales
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       GROUP BY c.name
       ORDER BY sales_count DESC
       LIMIT 5`
    );

    // Active providers
    const activeProviders = await db.query(
      `SELECT pr.business_name, COUNT(o.id) as orders_count, SUM(o.total_amount) as total_volume
       FROM orders o
       JOIN providers pr ON o.provider_id = pr.id
       GROUP BY pr.business_name
       ORDER BY orders_count DESC
       LIMIT 5`
    );

    return res.json({
      analytics: {
        totalUsers: parseInt(userCount[0].count, 10),
        totalProviders: parseInt(providerCount[0].count, 10),
        totalListings: parseInt(productCount[0].count, 10),
        totalOrders: parseInt(orderCount[0].count, 10),
        gtv: Math.round(gtv * 100) / 100,
        platformRevenue: Math.round(platformRevenue * 100) / 100,
        productsRescued,
        foodValueRescued: Math.round(foodValueRescued * 100) / 100,
        popularCategories,
        activeProviders
      }
    });
  } catch (error) {
    console.error('[Admin] Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin analytics.' });
  }
}

/**
 * Manage Providers (View, Approve, Reject, Suspend)
 */
export async function getAdminProviders(req, res) {
  try {
    const providers = await db.query(
      `SELECT pr.*, u.full_name AS owner_user_name, u.email AS user_email,
       (SELECT COUNT(*) FROM products WHERE provider_id = pr.id) as listing_count,
       (SELECT COUNT(*) FROM orders WHERE provider_id = pr.id) as order_count
       FROM providers pr
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`
    );

    return res.json({ providers });
  } catch (error) {
    console.error('[Admin] GetProviders error:', error);
    return res.status(500).json({ error: 'Failed to fetch providers.' });
  }
}

export async function updateProviderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected, suspended, pending

    const allowed = ['approved', 'rejected', 'suspended', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Choose from: ${allowed.join(', ')}` });
    }

    const providers = await db.query('SELECT * FROM providers WHERE id = $1', [id]);
    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const provider = providers[0];
    await db.query('UPDATE providers SET status = $1 WHERE id = $2', [status, id]);

    // Send notification to provider
    let message = `Your provider application status is now '${status}'.`;
    if (status === 'approved') {
      message = `Congratulations! Your provider account '${provider.business_name}' has been APPROVED. You can now list surplus food products!`;
    } else if (status === 'rejected') {
      message = `Your provider application was not approved. Please verify your business license details.`;
    }

    await createNotification({
      userId: provider.user_id,
      title: `Provider Account Update`,
      message,
      type: 'system',
      linkUrl: '/provider'
    });

    return res.json({ message: `Provider status updated to '${status}'.` });
  } catch (error) {
    console.error('[Admin] UpdateProviderStatus error:', error);
    return res.status(500).json({ error: 'Failed to update provider status.' });
  }
}

/**
 * Manage Users / Customers (View, Suspend, Activate)
 */
export async function getAdminUsers(req, res) {
  try {
    const users = await db.query(
      `SELECT id, email, full_name, role, status, phone, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return res.json({ users });
  } catch (error) {
    console.error('[Admin] GetUsers error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // active, suspended

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
    }

    await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    return res.json({ message: `User status changed to ${status}.` });
  } catch (error) {
    console.error('[Admin] UpdateUserStatus error:', error);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

/**
 * Manage Products (View all, Flag, Disable, Remove)
 */
export async function getAdminProducts(req, res) {
  try {
    const products = await db.query(
      `SELECT p.*, pr.business_name AS provider_name, c.name AS category_name
       FROM products p
       JOIN providers pr ON p.provider_id = pr.id
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    return res.json({ products });
  } catch (error) {
    console.error('[Admin] GetProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

export async function toggleProductStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await db.query('UPDATE products SET is_active = $1 WHERE id = $2', [
      isActive ? 1 : 0,
      id
    ]);

    return res.json({ message: `Product listing ${isActive ? 'enabled' : 'disabled'}.` });
  } catch (error) {
    console.error('[Admin] ToggleProductStatus error:', error);
    return res.status(500).json({ error: 'Failed to update product status.' });
  }
}

/**
 * Manage Orders (View all, Refund, Cancel)
 */
export async function getAdminOrders(req, res) {
  try {
    const orders = await db.query(
      `SELECT o.*, pr.business_name AS provider_name, c.user_id AS customer_user_id
       FROM orders o
       JOIN providers pr ON o.provider_id = pr.id
       JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC`
    );

    for (const ord of orders) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [ord.id]);
      ord.items = items;
    }

    return res.json({ orders });
  } catch (error) {
    console.error('[Admin] GetAdminOrders error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin orders.' });
  }
}

export async function refundOrder(req, res) {
  try {
    const { id } = req.params;
    const orders = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orders[0];
    await db.query("UPDATE orders SET status = 'REFUNDED' WHERE id = $1", [id]);
    await db.query("UPDATE payments SET status = 'REFUNDED' WHERE order_id = $1", [id]);

    return res.json({ message: `Order #${order.order_number} marked as REFUNDED.` });
  } catch (error) {
    console.error('[Admin] RefundOrder error:', error);
    return res.status(500).json({ error: 'Failed to refund order.' });
  }
}

export default {
  getAdminAnalytics,
  getAdminProviders,
  updateProviderStatus,
  getAdminUsers,
  updateUserStatus,
  getAdminProducts,
  toggleProductStatus,
  getAdminOrders,
  refundOrder
};
