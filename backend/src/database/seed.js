import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { initDatabase } from './initDb.js';

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function seedDatabase() {
  console.log('[Seed] Resetting and seeding database...');
  await initDatabase();

  // Clear existing records in correct foreign key order
  const tables = [
    'pickup_verifications', 'reviews', 'notifications', 'payments',
    'order_items', 'orders', 'inventory', 'product_images', 'products',
    'discount_rules', 'provider_documents', 'providers', 'customers',
    'addresses', 'admin_users', 'categories', 'users'
  ];

  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might not exist yet or empty
    }
  }

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  // ==========================================================
  // 1. SEED CATEGORIES (STRICTLY NO FRUITS OR VEGETABLES)
  // ==========================================================
  console.log('[Seed] Seeding categories...');
  const categoryData = [
    { name: 'Dairy Products', slug: 'dairy', description: 'Fresh milk, paneer, butter, cheese, and yogurts', icon: 'Milk' },
    { name: 'Bread & Bakery', slug: 'bakery', description: 'Freshly baked breads, buns, croissants, and artisan loaves', icon: 'Croissant' },
    { name: 'Cakes & Pastries', slug: 'cakes-pastries', description: 'Decadent cakes, tarts, pastries, and sweet confectioneries', icon: 'Cake' },
    { name: 'Ready-to-Eat Meals', slug: 'ready-to-eat', description: 'Fresh sandwiches, wraps, pasta, and ready-to-heat boxes', icon: 'Utensils' },
    { name: 'Restaurant Surplus', slug: 'restaurant-surplus', description: 'Gourmet daily surplus meals, curries, and meal trays', icon: 'Soup' },
    { name: 'Packaged Groceries', slug: 'packaged-food', description: 'Cereals, flour, cooking sauces, noodles, and packaged staples', icon: 'Package' },
    { name: 'Packaged Snacks', slug: 'snacks', description: 'Namkeen, chips, roasted nuts, biscuits, and snack bars', icon: 'Cookie' },
    { name: 'Beverages', slug: 'beverages', description: 'Cold brews, fruit-flavored sodas, juices, and specialty drinks', icon: 'Coffee' },
    { name: 'Frozen Foods', slug: 'frozen', description: 'Frozen pizzas, pockets, vegetarian nuggets, and quick bites', icon: 'Snowflake' },
    { name: 'Desserts', slug: 'desserts', description: 'Gulab jamuns, brownies, puddings, and sweet treats', icon: 'IceCream' }
  ];

  const categoryMap = {};
  for (const cat of categoryData) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO categories (id, name, slug, description, icon_name, is_active)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [id, cat.name, cat.slug, cat.description, cat.icon]
    );
    categoryMap[cat.slug] = id;
  }

  // ==========================================================
  // 2. SEED USERS & ROLES
  // ==========================================================
  console.log('[Seed] Seeding users and roles...');

  // Admin user
  const adminUserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'admin@example.com', $2, 'admin', 'Marketplace Ops Admin', '9880011223', 'active')`,
    [adminUserId, adminPasswordHash]
  );
  await db.query(
    `INSERT INTO admin_users (id, user_id, department, access_level)
     VALUES ($1, $2, 'Operations & Trust', 'SUPER_ADMIN')`,
    [uuidv4(), adminUserId]
  );

  // Customer user
  const customerUserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'customer@example.com', $2, 'customer', 'Rahul Verma', '9876543210', 'active')`,
    [customerUserId, defaultPasswordHash]
  );
  const customerId = uuidv4();
  const customerAddressId = uuidv4();
  await db.query(
    `INSERT INTO addresses (id, user_id, address_line1, city, state, postal_code, latitude, longitude, is_default)
     VALUES ($1, $2, '12th Main Road, Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9716, 77.5946, 1)`,
    [customerAddressId, customerUserId]
  );
  await db.query(
    `INSERT INTO customers (id, user_id, default_address_id, loyalty_points)
     VALUES ($1, $2, $3, 120)`,
    [customerId, customerUserId, customerAddressId]
  );

  // Provider 1: "The Daily Crumb Bakery" (Main demo provider)
  const provider1UserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'provider@example.com', $2, 'provider', 'Priya Sharma (The Daily Crumb)', '9845012345', 'active')`,
    [provider1UserId, defaultPasswordHash]
  );
  const provider1Id = uuidv4();
  await db.query(
    `INSERT INTO providers (
      id, user_id, business_name, owner_name, phone, email,
      address, latitude, longitude, business_type, license_number,
      bank_account_details, status, auto_discount_enabled, commission_rate
    ) VALUES ($1, $2, 'The Daily Crumb Bakery', 'Priya Sharma', '9845012345', 'provider@example.com',
      '80 Feet Road, 4th Block, Koramangala, Bangalore', 12.9345, 77.6200, 'Bakery & Café', 'FSSAI-112233445566',
      'HDFC Bank / IFSC HDFC0001234 / A/C 5010023456789', 'approved', 1, 5.00)`,
    [provider1Id, provider1UserId]
  );

  // Provider 2: "FreshMart Supermarket" (Indiranagar)
  const provider2UserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'freshmart@example.com', $2, 'provider', 'Sunil Kumar (FreshMart)', '9811099887', 'active')`,
    [provider2UserId, defaultPasswordHash]
  );
  const provider2Id = uuidv4();
  await db.query(
    `INSERT INTO providers (
      id, user_id, business_name, owner_name, phone, email,
      address, latitude, longitude, business_type, license_number,
      bank_account_details, status, auto_discount_enabled, commission_rate
    ) VALUES ($1, $2, 'FreshMart Supermarket', 'Sunil Kumar', '9811099887', 'freshmart@example.com',
      '100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore', 12.9784, 77.6408, 'Supermarket', 'FSSAI-223344556677',
      'ICICI Bank / IFSC ICIC0000002 / A/C 000201509988', 'approved', 1, 5.00)`,
    [provider2Id, provider2UserId]
  );

  // Provider 3: "Bake & Brew Café" (HSR Layout)
  const provider3UserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'bakebrew@example.com', $2, 'provider', 'Arjun Mehta', '9900112244', 'active')`,
    [provider3UserId, defaultPasswordHash]
  );
  const provider3Id = uuidv4();
  await db.query(
    `INSERT INTO providers (
      id, user_id, business_name, owner_name, phone, email,
      address, latitude, longitude, business_type, license_number,
      bank_account_details, status, auto_discount_enabled, commission_rate
    ) VALUES ($1, $2, 'Bake & Brew Café', 'Arjun Mehta', '9900112244', 'bakebrew@example.com',
      '27th Main, Sector 1, HSR Layout, Bangalore', 12.9121, 77.6446, 'Café & Bakery', 'FSSAI-334455667788',
      'SBI Bank / IFSC SBIN0001234', 'approved', 1, 5.00)`,
    [provider3Id, provider3UserId]
  );

  // Provider 4: "Urban Kitchens Cloud Kitchen" (Whitefield)
  const provider4UserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'urbankitchen@example.com', $2, 'provider', 'Farhan Ali', '9870022334', 'active')`,
    [provider4UserId, defaultPasswordHash]
  );
  const provider4Id = uuidv4();
  await db.query(
    `INSERT INTO providers (
      id, user_id, business_name, owner_name, phone, email,
      address, latitude, longitude, business_type, license_number,
      bank_account_details, status, auto_discount_enabled, commission_rate
    ) VALUES ($1, $2, 'Urban Kitchens Cloud Kitchen', 'Farhan Ali', '9870022334', 'urbankitchen@example.com',
      'ITPB Main Road, Whitefield, Bangalore', 12.9856, 77.7289, 'Cloud Kitchen', 'FSSAI-445566778899',
      'Axis Bank / IFSC UTIB0000123', 'approved', 1, 5.00)`,
    [provider4Id, provider4UserId]
  );

  // Provider 5: "Metro Grocery Depot" (Pending approval - for admin testing)
  const provider5UserId = uuidv4();
  await db.query(
    `INSERT INTO users (id, email, password_hash, role, full_name, phone, status)
     VALUES ($1, 'metrodepot@example.com', $2, 'provider', 'Rajesh Gupta', '9811223344', 'active')`,
    [provider5UserId, defaultPasswordHash]
  );
  const provider5Id = uuidv4();
  await db.query(
    `INSERT INTO providers (
      id, user_id, business_name, owner_name, phone, email,
      address, latitude, longitude, business_type, license_number,
      bank_account_details, status, auto_discount_enabled, commission_rate
    ) VALUES ($1, $2, 'Metro Grocery Depot', 'Rajesh Gupta', '9811223344', 'metrodepot@example.com',
      'Commercial Street, Tasker Town, Bangalore', 12.9822, 77.6083, 'Grocery Store', 'FSSAI-556677889900',
      'Kotak Bank / IFSC KKBK0000123', 'pending', 1, 5.00)`,
    [provider5Id, provider5UserId]
  );

  // ==========================================================
  // 3. SEED PRODUCTS (REALISTIC FOODS - ZERO FRUITS OR VEGETABLES)
  // ==========================================================
  console.log('[Seed] Seeding products...');

  const productsData = [
    // FreshMart Supermarket Items
    {
      providerId: provider2Id,
      categorySlug: 'dairy',
      name: 'Amul Malai Paneer 200g',
      description: 'Rich, soft, creamy fresh cottage cheese paneer pack. Ideal for curries, paneer bhurji, or grilling.',
      mrp: 100,
      originalPrice: 100,
      discountPercent: 50,
      discountedPrice: 50,
      quantity: 5,
      bestBeforeDate: addDays(1), // Tomorrow
      expiryDate: addDays(1),
      storageInstructions: 'Keep refrigerated below 4°C. Consume upon opening.',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80'
    },
    {
      providerId: provider2Id,
      categorySlug: 'bakery',
      name: 'Britannia 100% Whole Wheat Brown Bread 400g',
      description: 'Healthy, nutrient-rich whole grain sliced brown bread loaf. Freshly baked with zero trans fat.',
      mrp: 60,
      originalPrice: 60,
      discountPercent: 50,
      discountedPrice: 30,
      quantity: 8,
      bestBeforeDate: addDays(1), // Tomorrow
      expiryDate: addDays(1),
      storageInstructions: 'Store in a cool, dry place. Keep wrapped to retain moisture.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80'
    },
    {
      providerId: provider2Id,
      categorySlug: 'dairy',
      name: 'Epigamia Greek Yogurt Strawberry 400g',
      description: 'Thick, creamy Greek yogurt made with real strawberry pulp. High protein and packed with probiotics.',
      mrp: 80,
      originalPrice: 80,
      discountPercent: 50,
      discountedPrice: 40,
      quantity: 10,
      bestBeforeDate: addDays(2), // 2 days
      expiryDate: addDays(2),
      storageInstructions: 'Refrigerate immediately between 2°C to 8°C.',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'
    },
    {
      providerId: provider2Id,
      categorySlug: 'dairy',
      name: 'Mother Dairy Cow Milk 500ml',
      description: 'Pasteurized homogenized cow milk pouch, rich in calcium and natural vitamin A.',
      mrp: 34,
      originalPrice: 34,
      discountPercent: 50,
      discountedPrice: 17,
      quantity: 14,
      bestBeforeDate: addDays(0), // Today
      expiryDate: addDays(0),
      storageInstructions: 'Boil before use or refrigerate under 4°C.',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'
    },
    {
      providerId: provider2Id,
      categorySlug: 'packaged-food',
      name: 'Maggi 2-Minute Masala Noodles Pack of 4',
      description: 'Classic favorite instant noodles with signature aromatic Indian spice mix.',
      mrp: 60,
      originalPrice: 60,
      discountPercent: 30,
      discountedPrice: 42,
      quantity: 18,
      bestBeforeDate: addDays(6), // 6 days
      expiryDate: addDays(6),
      storageInstructions: 'Store in an airtight container in a cool, dark pantry.',
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&q=80'
    },
    {
      providerId: provider2Id,
      categorySlug: 'snacks',
      name: "Haldiram's Aloo Bhujia 200g",
      description: 'Crispy, spiced potato and gram flour extruded noodles snack. Classic Indian savory crunch.',
      mrp: 70,
      originalPrice: 70,
      discountPercent: 40,
      discountedPrice: 42,
      quantity: 15,
      bestBeforeDate: addDays(5),
      expiryDate: addDays(5),
      storageInstructions: 'Keep in dry air-tight jar after opening.',
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80'
    },

    // The Daily Crumb Bakery Items (Main Provider)
    {
      providerId: provider1Id,
      categorySlug: 'cakes-pastries',
      name: 'Dutch Chocolate Truffle Pastry',
      description: 'Moist dark chocolate sponge layered with decadent Belgian ganache and chocolate curls.',
      mrp: 180,
      originalPrice: 180,
      discountPercent: 50,
      discountedPrice: 90,
      quantity: 6,
      bestBeforeDate: addDays(0), // Ending Today
      expiryDate: addDays(0),
      storageInstructions: 'Keep chilled. Best enjoyed when brought to room temperature 10 mins prior.',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80'
    },
    {
      providerId: provider1Id,
      categorySlug: 'cakes-pastries',
      name: 'Belgian Dark Chocolate Cake 500g',
      description: 'Artisanal celebration cake loaded with 70% dark cocoa and dusted with gold powder.',
      mrp: 450,
      originalPrice: 450,
      discountPercent: 50,
      discountedPrice: 225,
      quantity: 3,
      bestBeforeDate: addDays(0), // Ending Today
      expiryDate: addDays(0),
      storageInstructions: 'Store in pastry refrigerator under 5°C.',
      imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&q=80'
    },
    {
      providerId: provider1Id,
      categorySlug: 'bakery',
      name: 'Artisan Garlic & Herb Focaccia 300g',
      description: 'Traditional Italian flatbread infused with rosemary, roasted garlic, and extra virgin olive oil.',
      mrp: 140,
      originalPrice: 140,
      discountPercent: 50,
      discountedPrice: 70,
      quantity: 7,
      bestBeforeDate: addDays(1), // Tomorrow
      expiryDate: addDays(1),
      storageInstructions: 'Warm in an oven or toaster for 2 minutes before serving.',
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&q=80'
    },
    {
      providerId: provider1Id,
      categorySlug: 'desserts',
      name: 'Walnut Chocolate Fudge Brownie Pack of 2',
      description: 'Chewy, dense chocolate fudge brownies loaded with California walnuts.',
      mrp: 160,
      originalPrice: 160,
      discountPercent: 50,
      discountedPrice: 80,
      quantity: 8,
      bestBeforeDate: addDays(1),
      expiryDate: addDays(1),
      storageInstructions: 'Microwave for 15 seconds for a molten center.',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80'
    },

    // Bake & Brew Café Items
    {
      providerId: provider3Id,
      categorySlug: 'ready-to-eat',
      name: 'Grilled Paneer Tikka Sandwich',
      description: 'Tandoori marinated paneer cubes with mint chutney and melted cheddar on toasted sourdough.',
      mrp: 120,
      originalPrice: 120,
      discountPercent: 50,
      discountedPrice: 60,
      quantity: 6,
      bestBeforeDate: addDays(0), // Ending today
      expiryDate: addDays(0),
      storageInstructions: 'Consume immediately or reheat on grill pan.',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80'
    },
    {
      providerId: provider3Id,
      categorySlug: 'beverages',
      name: 'Raw Pressery Cold Brew Nitro Coffee 250ml',
      description: 'Slow-steeped Arabica coffee brewed for 18 hours. Smooth, bold, and low-acid kick.',
      mrp: 150,
      originalPrice: 150,
      discountPercent: 50,
      discountedPrice: 75,
      quantity: 8,
      bestBeforeDate: addDays(2),
      expiryDate: addDays(2),
      storageInstructions: 'Shake well and serve ice cold.',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80'
    },
    {
      providerId: provider3Id,
      categorySlug: 'desserts',
      name: 'Warm Gulab Jamun in Saffron Syrup (Pack of 6)',
      description: 'Traditional khoya dumplings fried golden and soaked in aromatic cardamom-saffron syrup.',
      mrp: 200,
      originalPrice: 200,
      discountPercent: 40,
      discountedPrice: 120,
      quantity: 5,
      bestBeforeDate: addDays(3),
      expiryDate: addDays(3),
      storageInstructions: 'Reheat slightly before serving for maximum softness.',
      imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80'
    },

    // Urban Kitchens Cloud Kitchen Items
    {
      providerId: provider4Id,
      categorySlug: 'ready-to-eat',
      name: 'Hyderabadi Paneer Dum Biryani Meal Box',
      description: 'Fragrant long-grain basmati rice layered with spiced paneer, fried onions, and saffron. Includes raita.',
      mrp: 260,
      originalPrice: 260,
      discountPercent: 50,
      discountedPrice: 130,
      quantity: 7,
      bestBeforeDate: addDays(0), // Today
      expiryDate: addDays(0),
      storageInstructions: 'Keep hot or reheat in microwave for 90 seconds.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80'
    },
    {
      providerId: provider4Id,
      categorySlug: 'frozen',
      name: 'ITC Master Chef Veggie Pizza Pockets 250g',
      description: 'Crisp golden crust pockets filled with mozzarella, corn, and tangy Italian marinara sauce.',
      mrp: 180,
      originalPrice: 180,
      discountPercent: 35,
      discountedPrice: 117,
      quantity: 11,
      bestBeforeDate: addDays(5),
      expiryDate: addDays(5),
      storageInstructions: 'Store in deep freezer at -18°C or below.',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'
    },
    {
      providerId: provider4Id,
      categorySlug: 'snacks',
      name: 'Britannia Good Day Butter Cookies Box 600g',
      description: 'Rich buttery cookies with cashew accents, baked golden for tea-time crunch.',
      mrp: 120,
      originalPrice: 120,
      discountPercent: 30,
      discountedPrice: 84,
      quantity: 16,
      bestBeforeDate: addDays(10), // Normal shelf life
      expiryDate: addDays(10),
      storageInstructions: 'Store in dry place away from direct sunlight.',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80'
    }
  ];

  const seededProducts = [];

  for (const p of productsData) {
    const productId = uuidv4();
    const categoryId = categoryMap[p.categorySlug];

    await db.query(
      `INSERT INTO products (
        id, provider_id, category_id, name, description,
        mrp, original_price, discount_percent, discounted_price,
        quantity, best_before_date, expiry_date, storage_instructions,
        pickup_start_time, pickup_end_time, is_active, auto_discount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '10:00', '21:00', 1, 1)`,
      [
        productId,
        p.providerId,
        categoryId,
        p.name,
        p.description,
        p.mrp,
        p.originalPrice,
        p.discountPercent,
        p.discountedPrice,
        p.quantity,
        p.bestBeforeDate,
        p.expiryDate,
        p.storageInstructions
      ]
    );

    // Product image
    await db.query(
      `INSERT INTO product_images (id, product_id, image_url, is_primary)
       VALUES ($1, $2, $3, 1)`,
      [uuidv4(), productId, p.imageUrl]
    );

    // Inventory
    await db.query(
      `INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity)
       VALUES ($1, $2, $3, 0, 0)`,
      [uuidv4(), productId, p.quantity]
    );

    seededProducts.push({ id: productId, ...p });
  }

  // ==========================================================
  // 4. SEED SAMPLE ORDERS (Demonstrating live pickup & history)
  // ==========================================================
  console.log('[Seed] Seeding sample orders...');

  // Sample Order 1: Confirmed order with live QR & Pickup code
  const order1Id = uuidv4();
  const order1Code = '7392';
  const qr1Data = JSON.stringify({
    orderId: order1Id,
    orderNumber: 'FD10293',
    pickupCode: order1Code,
    providerId: provider1Id
  });

  await db.query(
    `INSERT INTO orders (
      id, order_number, customer_id, provider_id, subtotal,
      platform_fee, total_amount, status, pickup_start_time,
      pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone
    ) VALUES ($1, 'FD10293', $2, $3, 160.00, 5.00, 165.00, 'READY_FOR_PICKUP', '16:00', '20:00', $4, $5, 'Rahul Verma', '9876543210')`,
    [order1Id, customerId, provider1Id, order1Code, qr1Data]
  );

  const bakeryItems = seededProducts.filter((p) => p.providerId === provider1Id);
  if (bakeryItems.length >= 2) {
    await db.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_original_price, unit_discounted_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), order1Id, bakeryItems[0].id, bakeryItems[0].name, bakeryItems[0].originalPrice, bakeryItems[0].discountedPrice, 1, bakeryItems[0].discountedPrice]
    );
    await db.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, unit_original_price, unit_discounted_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), order1Id, bakeryItems[1].id, bakeryItems[1].name, bakeryItems[1].originalPrice, bakeryItems[1].discountedPrice, 1, bakeryItems[1].discountedPrice]
    );
  }

  await db.query(
    `INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status)
     VALUES ($1, $2, $3, 165.00, 'UPI (Google Pay)', 'TXN_SAMPLE_001', 'COMPLETED')`,
    [uuidv4(), order1Id, customerId]
  );

  // Sample Order 2: Already Picked Up (To demonstrate pickup verification history)
  const order2Id = uuidv4();
  const order2Code = '4819';
  const qr2Data = JSON.stringify({
    orderId: order2Id,
    orderNumber: 'FD10188',
    pickupCode: order2Code,
    providerId: provider1Id
  });

  await db.query(
    `INSERT INTO orders (
      id, order_number, customer_id, provider_id, subtotal,
      platform_fee, total_amount, status, pickup_start_time,
      pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone
    ) VALUES ($1, 'FD10188', $2, $3, 225.00, 5.00, 230.00, 'PICKED_UP', '14:00', '18:00', $4, $5, 'Rahul Verma', '9876543210')`,
    [order2Id, customerId, provider1Id, order2Code, qr2Data]
  );

  await db.query(
    `INSERT INTO pickup_verifications (id, order_id, provider_id, verified_by_user_id, verified_code, verification_method, notes)
     VALUES ($1, $2, $3, $4, $5, 'CODE', 'Verified by store manager at checkout counter')`,
    [uuidv4(), order2Id, provider1Id, provider1UserId, order2Code]
  );

  await db.query(
    `INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status)
     VALUES ($1, $2, $3, 230.00, 'UPI (PhonePe)', 'TXN_SAMPLE_002', 'COMPLETED')`,
    [uuidv4(), order2Id, customerId]
  );

  // Sample Notifications
  await db.query(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url)
     VALUES ($1, $2, 'Order FD10293 Ready for Pickup!', 'Your rescued treats are packed and waiting at The Daily Crumb Bakery. Pickup Code: 7392.', 'order_update', 0, '/orders')`,
    [uuidv4(), customerUserId]
  );
  await db.query(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url)
     VALUES ($1, $2, '3 Listings Ending Today!', 'Keep an eye on today’s clearance pastries to ensure smooth customer pickups.', 'expiry_alert', 0, '/provider/products')`,
    [uuidv4(), provider1UserId]
  );

  console.log('=======================================================');
  console.log('  DATABASE SEEDING COMPLETED SUCCESSFULLY!             ');
  console.log('  ---------------------------------------------------  ');
  console.log('  Demo Logins:                                         ');
  console.log('  1. Customer: customer@example.com / password123      ');
  console.log('  2. Provider: provider@example.com / password123      ');
  console.log('  3. Admin:    admin@example.com    / admin123         ');
  console.log('  Categories seeded: 10 (Strictly zero fruits/veg)     ');
  console.log('  Products seeded:   16 realistic Indian food items    ');
  console.log('=======================================================');
}

if (process.argv[1] && process.argv[1].includes('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
