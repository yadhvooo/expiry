import db from '../config/db.js';
import { classifyExpiry } from '../services/expiryService.js';
import { calculateDistanceKm } from '../services/distanceService.js';

/**
 * Get all available marketplace products with discovery, filtering, and geolocation
 */
export async function getProducts(req, res) {
  try {
    const {
      category,
      minDiscount,
      maxDistance,
      urgency,
      search,
      lat,
      lng,
      sortBy = 'distance' // distance, discount, price_asc, expiry
    } = req.query;

    const customerLat = lat ? parseFloat(lat) : 12.9716; // default Bangalore
    const customerLng = lng ? parseFloat(lng) : 77.5946;

    // Only active products from APPROVED providers
    let querySql = `
      SELECT 
        p.*,
        pr.business_name AS provider_name,
        pr.address AS provider_address,
        pr.latitude AS provider_lat,
        pr.longitude AS provider_lng,
        pr.phone AS provider_phone,
        pr.status AS provider_status,
        c.name AS category_name,
        c.slug AS category_slug,
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = p.id 
          ORDER BY is_primary DESC 
          LIMIT 1
        ) AS primary_image_url
      FROM products p
      JOIN providers pr ON p.provider_id = pr.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
        AND p.quantity > 0
        AND pr.status = 'approved'
    `;

    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      querySql += ` AND (c.slug = $${params.length} OR c.name = $${params.length})`;
    }

    if (minDiscount) {
      params.push(parseFloat(minDiscount));
      querySql += ` AND p.discount_percent >= $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      querySql += ` AND (
        LOWER(p.name) LIKE $${params.length} 
        OR LOWER(p.description) LIKE $${params.length} 
        OR LOWER(pr.business_name) LIKE $${params.length}
        OR LOWER(c.name) LIKE $${params.length}
      )`;
    }

    const rows = await db.query(querySql, params);

    // Filter expired items, compute expiry classification & distance
    let processed = rows
      .map((item) => {
        const expiryInfo = classifyExpiry(item.expiry_date || item.best_before_date);
        const distanceKm = calculateDistanceKm(
          customerLat,
          customerLng,
          parseFloat(item.provider_lat),
          parseFloat(item.provider_lng)
        );

        return {
          ...item,
          distance_km: distanceKm,
          expiry_status: expiryInfo.status,
          expiry_badge: expiryInfo.badge,
          days_remaining: expiryInfo.daysRemaining,
          is_sellable: expiryInfo.isSellable,
          urgency_level: expiryInfo.urgencyLevel,
          image_url: item.primary_image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
        };
      })
      // Food safety: Strictly filter out any expired product!
      .filter((item) => item.is_sellable);

    // Filter by urgency if requested
    if (urgency && urgency !== 'all') {
      processed = processed.filter((item) => item.expiry_status === urgency.toUpperCase());
    }

    // Filter by maxDistance if requested
    if (maxDistance) {
      const maxDist = parseFloat(maxDistance);
      processed = processed.filter((item) => item.distance_km == null || item.distance_km <= maxDist);
    }

    // Sorting
    if (sortBy === 'distance') {
      processed.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
    } else if (sortBy === 'discount') {
      processed.sort((a, b) => b.discount_percent - a.discount_percent);
    } else if (sortBy === 'price_asc') {
      processed.sort((a, b) => a.discounted_price - b.discounted_price);
    } else if (sortBy === 'expiry') {
      processed.sort((a, b) => a.days_remaining - b.days_remaining);
    }

    return res.json({
      count: processed.length,
      products: processed
    });
  } catch (error) {
    console.error('[Product] GetProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

/**
 * Get single product details
 */
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    const rows = await db.query(
      `SELECT 
        p.*,
        pr.business_name AS provider_name,
        pr.address AS provider_address,
        pr.latitude AS provider_lat,
        pr.longitude AS provider_lng,
        pr.phone AS provider_phone,
        pr.business_type AS provider_type,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      JOIN providers pr ON p.provider_id = pr.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = rows[0];
    const expiryInfo = classifyExpiry(product.expiry_date || product.best_before_date);

    // Fetch images
    const images = await db.query(
      'SELECT image_url, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC',
      [id]
    );

    const customerLat = lat ? parseFloat(lat) : 12.9716;
    const customerLng = lng ? parseFloat(lng) : 77.5946;
    const distanceKm = calculateDistanceKm(
      customerLat,
      customerLng,
      parseFloat(product.provider_lat),
      parseFloat(product.provider_lng)
    );

    return res.json({
      product: {
        ...product,
        distance_km: distanceKm,
        expiry_status: expiryInfo.status,
        expiry_badge: expiryInfo.badge,
        days_remaining: expiryInfo.daysRemaining,
        is_sellable: expiryInfo.isSellable,
        images: images.length > 0 ? images.map((i) => i.image_url) : [
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'
        ]
      }
    });
  } catch (error) {
    console.error('[Product] GetProductById error:', error);
    return res.status(500).json({ error: 'Failed to fetch product details.' });
  }
}

/**
 * Get active marketplace food categories (no fruits/veg)
 */
export async function getCategories(req, res) {
  try {
    const categories = await db.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC'
    );
    return res.json({ categories });
  } catch (error) {
    console.error('[Product] GetCategories error:', error);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

export default {
  getProducts,
  getProductById,
  getCategories
};
