import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportToMySQL() {
  console.log('[Export] Exporting database to MySQL format for MySQL Workbench...');

  const outputPath = path.resolve(__dirname, '../../data/marketplace_mysql.sql');
  const tables = [
    'categories',
    'users',
    'addresses',
    'customers',
    'providers',
    'provider_documents',
    'products',
    'product_images',
    'inventory',
    'discount_rules',
    'orders',
    'order_items',
    'payments',
    'pickup_verifications',
    'reviews',
    'notifications',
    'admin_users'
  ];

  let sql = `-- ==========================================================
-- RescueBites Food Expiry Marketplace
-- MySQL Workbench Compatible Database Export
-- Generated on: ${new Date().toISOString()}
-- ==========================================================

CREATE DATABASE IF NOT EXISTS rescuebites CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rescuebites;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. ADDRESSES
DROP TABLE IF EXISTS addresses;
CREATE TABLE addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CUSTOMERS
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    default_address_id VARCHAR(36),
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. PROVIDERS
DROP TABLE IF EXISTS providers;
CREATE TABLE providers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    license_number VARCHAR(100),
    bank_account_details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. PROVIDER DOCUMENTS
DROP TABLE IF EXISTS provider_documents;
CREATE TABLE provider_documents (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 6. CATEGORIES
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PRODUCTS
DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mrp DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    discount_percent INT NOT NULL DEFAULT 0,
    discounted_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    best_before_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    storage_instructions TEXT,
    pickup_start_time VARCHAR(10),
    pickup_end_time VARCHAR(10),
    is_active TINYINT(1) DEFAULT 1,
    auto_discount TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 8. PRODUCT IMAGES
DROP TABLE IF EXISTS product_images;
CREATE TABLE product_images (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 9. INVENTORY
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) UNIQUE NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    sold_quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 10. DISCOUNT RULES
DROP TABLE IF EXISTS discount_rules;
CREATE TABLE discount_rules (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36),
    days_to_expiry INT NOT NULL,
    recommended_discount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. ORDERS
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 5.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    pickup_time_slot VARCHAR(50),
    pickup_code VARCHAR(10),
    qr_code_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE RESTRICT
);

-- 12. ORDER ITEMS
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_original_price DECIMAL(10, 2) NOT NULL,
    unit_discounted_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 13. PAYMENTS
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 14. PICKUP VERIFICATIONS
DROP TABLE IF EXISTS pickup_verifications;
CREATE TABLE pickup_verifications (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    verified_by_user_id VARCHAR(36) NOT NULL,
    verification_method VARCHAR(20) DEFAULT 'CODE',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 15. REVIEWS
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 16. NOTIFICATIONS
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    link_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. ADMIN USERS
DROP TABLE IF EXISTS admin_users;
CREATE TABLE admin_users (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    department VARCHAR(100) DEFAULT 'Marketplace Operations',
    access_level VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\n-- ==========================================================
-- INSERTING DATA
-- ==========================================================\n\n`;

  function escapeSqlValue(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return `'${str}'`;
  }

  for (const table of tables) {
    try {
      const rows = await db.query(`SELECT * FROM ${table}`);
      if (rows.length > 0) {
        sql += `-- Table: ${table} (${rows.length} rows)\n`;
        for (const row of rows) {
          const keys = Object.keys(row);
          const cols = keys.join(', ');
          const vals = keys.map(k => escapeSqlValue(row[k])).join(', ');
          sql += `INSERT INTO ${table} (${cols}) VALUES (${vals});\n`;
        }
        sql += '\n';
      }
    } catch (e) {
      console.warn(`[Export] Skipping table ${table}:`, e.message);
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`[Export] Successfully created MySQL export at: ${outputPath}`);
}

exportToMySQL().catch(console.error);
