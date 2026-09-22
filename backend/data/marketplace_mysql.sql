-- ==========================================================
-- RescueBites Food Expiry Marketplace
-- MySQL Workbench Compatible Database Export
-- Generated on: 2026-09-22T11:11:04.218Z
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


-- ==========================================================
-- INSERTING DATA
-- ==========================================================

-- Table: categories (10 rows)
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('de4ded08-e336-4ca1-8b47-4354eeeb559b', 'Dairy Products', 'dairy', 'Fresh milk, paneer, butter, cheese, and yogurts', 'Milk', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('2a870ecc-f046-4a4b-ae6d-1f2e29f325a9', 'Bread & Bakery', 'bakery', 'Freshly baked breads, buns, croissants, and artisan loaves', 'Croissant', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('9305c077-0923-42d3-83ad-2ac0cc5146cf', 'Cakes & Pastries', 'cakes-pastries', 'Decadent cakes, tarts, pastries, and sweet confectioneries', 'Cake', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('a8a49467-18a4-4441-9675-e1ce7dd98faf', 'Ready-to-Eat Meals', 'ready-to-eat', 'Fresh sandwiches, wraps, pasta, and ready-to-heat boxes', 'Utensils', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('9a09708e-503c-4380-9cfc-6ac3ff0d07b2', 'Restaurant Surplus', 'restaurant-surplus', 'Gourmet daily surplus meals, curries, and meal trays', 'Soup', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('08d4b15a-6918-4353-903e-b72fb455380c', 'Packaged Groceries', 'packaged-food', 'Cereals, flour, cooking sauces, noodles, and packaged staples', 'Package', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('cfdf14ff-b71d-41a3-80a5-c5a63d725655', 'Packaged Snacks', 'snacks', 'Namkeen, chips, roasted nuts, biscuits, and snack bars', 'Cookie', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('1ee589a5-e259-41e3-866c-fd69445a041d', 'Beverages', 'beverages', 'Cold brews, fruit-flavored sodas, juices, and specialty drinks', 'Coffee', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('9fe91a8c-965e-48f6-9b72-b8e1fec72bba', 'Frozen Foods', 'frozen', 'Frozen pizzas, pockets, vegetarian nuggets, and quick bites', 'Snowflake', 1, '2026-09-21 16:29:54');
INSERT INTO categories (id, name, slug, description, icon_name, is_active, created_at) VALUES ('5769d072-5bbc-4028-8555-5608464f4310', 'Desserts', 'desserts', 'Gulab jamuns, brownies, puddings, and sweet treats', 'IceCream', 1, '2026-09-21 16:29:54');

-- Table: users (7 rows)
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('6fef4ce6-c17a-4118-9b9c-da42fbc32f30', 'admin@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeB9Cbsv.CwRl4ZyuPbZDV73LUvaplp9O', 'admin', 'Marketplace Ops Admin', '9880011223', 'active', '2026-09-21 16:29:54', '2026-09-21 16:29:54');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('8dd87b35-4ab3-4004-8331-8bbc732d13a2', 'customer@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'customer', 'Rahul Verma', '9876543210', 'active', '2026-09-21 16:29:54', '2026-09-21 16:29:54');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('988990d3-519f-443b-ba70-a0a5593659b5', 'provider@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'provider', 'Priya Sharma (The Daily Crumb)', '9845012345', 'active', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('b584f98a-2a8e-4c1c-8ac3-ecf19ec99b69', 'freshmart@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'provider', 'Sunil Kumar (FreshMart)', '9811099887', 'active', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('6dc9433c-c783-4e4e-92d4-4b5b53462ee7', 'bakebrew@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'provider', 'Arjun Mehta', '9900112244', 'active', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('9e582b35-e3c6-4f37-ba57-9fd466cbf1e6', 'urbankitchen@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'provider', 'Farhan Ali', '9870022334', 'active', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at, updated_at) VALUES ('003f4e88-88fa-4c7c-8bfc-22f686781337', 'metrodepot@example.com', '$2a$10$LEFqMxhi20g1E/zY6ue8YeR7eAjLonciIUsua9QnqifCGy4UFnXem', 'provider', 'Rajesh Gupta', '9811223344', 'active', '2026-09-21 16:29:55', '2026-09-21 16:29:55');

-- Table: addresses (1 rows)
INSERT INTO addresses (id, user_id, address_line1, address_line2, city, state, postal_code, latitude, longitude, is_default, created_at) VALUES ('4a7ef051-494c-4742-bff3-3aefb05d783e', '8dd87b35-4ab3-4004-8331-8bbc732d13a2', '12th Main Road, Indiranagar', NULL, 'Bangalore', 'Karnataka', '560038', 12.9716, 77.5946, 1, '2026-09-21 16:29:55');

-- Table: customers (1 rows)
INSERT INTO customers (id, user_id, default_address_id, loyalty_points, created_at) VALUES ('76d06bfd-e6c0-4ebe-a212-2238be6186ce', '8dd87b35-4ab3-4004-8331-8bbc732d13a2', '4a7ef051-494c-4742-bff3-3aefb05d783e', 120, '2026-09-21 16:29:55');

-- Table: providers (5 rows)
INSERT INTO providers (id, user_id, business_name, owner_name, phone, email, address, latitude, longitude, business_type, license_number, bank_account_details, status, auto_discount_enabled, commission_rate, created_at) VALUES ('d7532028-b6c1-4aae-9df7-0f699f5dc320', '988990d3-519f-443b-ba70-a0a5593659b5', 'The Daily Crumb Bakery', 'Priya Sharma', '9845012345', 'provider@example.com', '80 Feet Road, 4th Block, Koramangala, Bangalore', 12.9345, 77.62, 'Bakery & Café', 'FSSAI-112233445566', 'HDFC Bank / IFSC HDFC0001234 / A/C 5010023456789', 'approved', 1, 5, '2026-09-21 16:29:55');
INSERT INTO providers (id, user_id, business_name, owner_name, phone, email, address, latitude, longitude, business_type, license_number, bank_account_details, status, auto_discount_enabled, commission_rate, created_at) VALUES ('26896003-353e-41c0-a1e8-934b3c8acc73', 'b584f98a-2a8e-4c1c-8ac3-ecf19ec99b69', 'FreshMart Supermarket', 'Sunil Kumar', '9811099887', 'freshmart@example.com', '100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore', 12.9784, 77.6408, 'Supermarket', 'FSSAI-223344556677', 'ICICI Bank / IFSC ICIC0000002 / A/C 000201509988', 'approved', 1, 5, '2026-09-21 16:29:55');
INSERT INTO providers (id, user_id, business_name, owner_name, phone, email, address, latitude, longitude, business_type, license_number, bank_account_details, status, auto_discount_enabled, commission_rate, created_at) VALUES ('12c47191-2927-45aa-a790-94643e6987e6', '6dc9433c-c783-4e4e-92d4-4b5b53462ee7', 'Bake & Brew Café', 'Arjun Mehta', '9900112244', 'bakebrew@example.com', '27th Main, Sector 1, HSR Layout, Bangalore', 12.9121, 77.6446, 'Café & Bakery', 'FSSAI-334455667788', 'SBI Bank / IFSC SBIN0001234', 'approved', 1, 5, '2026-09-21 16:29:55');
INSERT INTO providers (id, user_id, business_name, owner_name, phone, email, address, latitude, longitude, business_type, license_number, bank_account_details, status, auto_discount_enabled, commission_rate, created_at) VALUES ('2478c45f-9be0-4038-9ce8-c35335f1abd6', '9e582b35-e3c6-4f37-ba57-9fd466cbf1e6', 'Urban Kitchens Cloud Kitchen', 'Farhan Ali', '9870022334', 'urbankitchen@example.com', 'ITPB Main Road, Whitefield, Bangalore', 12.9856, 77.7289, 'Cloud Kitchen', 'FSSAI-445566778899', 'Axis Bank / IFSC UTIB0000123', 'approved', 1, 5, '2026-09-21 16:29:55');
INSERT INTO providers (id, user_id, business_name, owner_name, phone, email, address, latitude, longitude, business_type, license_number, bank_account_details, status, auto_discount_enabled, commission_rate, created_at) VALUES ('dbeb3ff9-f074-412d-9fd3-e308c8ddda4d', '003f4e88-88fa-4c7c-8bfc-22f686781337', 'Metro Grocery Depot', 'Rajesh Gupta', '9811223344', 'metrodepot@example.com', 'Commercial Street, Tasker Town, Bangalore', 12.9822, 77.6083, 'Grocery Store', 'FSSAI-556677889900', 'Kotak Bank / IFSC KKBK0000123', 'approved', 1, 5, '2026-09-21 16:29:55');

-- Table: products (16 rows)
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('14896d70-09c4-4559-b9fb-a00d55e0bfed', '26896003-353e-41c0-a1e8-934b3c8acc73', 'de4ded08-e336-4ca1-8b47-4354eeeb559b', 'Amul Malai Paneer 200g', 'Rich, soft, creamy fresh cottage cheese paneer pack. Ideal for curries, paneer bhurji, or grilling.', 100, 100, 50, 50, 5, '2026-09-22', '2026-09-22', 'Keep refrigerated below 4°C. Consume upon opening.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('f3f4b94b-2226-4bde-9502-6cb61d42097e', '26896003-353e-41c0-a1e8-934b3c8acc73', '2a870ecc-f046-4a4b-ae6d-1f2e29f325a9', 'Britannia 100% Whole Wheat Brown Bread 400g', 'Healthy, nutrient-rich whole grain sliced brown bread loaf. Freshly baked with zero trans fat.', 60, 60, 50, 30, 8, '2026-09-22', '2026-09-22', 'Store in a cool, dry place. Keep wrapped to retain moisture.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('4775d0f4-d3a0-4da0-8665-17eaaa147d8a', '26896003-353e-41c0-a1e8-934b3c8acc73', 'de4ded08-e336-4ca1-8b47-4354eeeb559b', 'Epigamia Greek Yogurt Strawberry 400g', 'Thick, creamy Greek yogurt made with real strawberry pulp. High protein and packed with probiotics.', 80, 80, 50, 40, 10, '2026-09-23', '2026-09-23', 'Refrigerate immediately between 2°C to 8°C.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('7d03bc27-dc79-409a-8cfc-04294ea9f598', '26896003-353e-41c0-a1e8-934b3c8acc73', 'de4ded08-e336-4ca1-8b47-4354eeeb559b', 'Mother Dairy Cow Milk 500ml', 'Pasteurized homogenized cow milk pouch, rich in calcium and natural vitamin A.', 34, 34, 50, 17, 14, '2026-09-21', '2026-09-21', 'Boil before use or refrigerate under 4°C.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('d6e08571-bdb9-44dd-bc2a-ff6fbbf3dd8a', '26896003-353e-41c0-a1e8-934b3c8acc73', '08d4b15a-6918-4353-903e-b72fb455380c', 'Maggi 2-Minute Masala Noodles Pack of 4', 'Classic favorite instant noodles with signature aromatic Indian spice mix.', 60, 60, 30, 42, 18, '2026-09-27', '2026-09-27', 'Store in an airtight container in a cool, dark pantry.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('ab45a750-8a58-4f5f-b162-ce10a41e151d', '26896003-353e-41c0-a1e8-934b3c8acc73', 'cfdf14ff-b71d-41a3-80a5-c5a63d725655', 'Haldiram\'s Aloo Bhujia 200g', 'Crispy, spiced potato and gram flour extruded noodles snack. Classic Indian savory crunch.', 70, 70, 40, 42, 15, '2026-09-26', '2026-09-26', 'Keep in dry air-tight jar after opening.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('712c8cfa-a485-4f64-9fdd-0c6f7218f3c0', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '9305c077-0923-42d3-83ad-2ac0cc5146cf', 'Dutch Chocolate Truffle Pastry', 'Moist dark chocolate sponge layered with decadent Belgian ganache and chocolate curls.', 180, 180, 50, 90, 5, '2026-09-21', '2026-09-21', 'Keep chilled. Best enjoyed when brought to room temperature 10 mins prior.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('6c70641b-e3da-4de3-8440-3024604bcf56', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '9305c077-0923-42d3-83ad-2ac0cc5146cf', 'Belgian Dark Chocolate Cake 500g', 'Artisanal celebration cake loaded with 70% dark cocoa and dusted with gold powder.', 450, 450, 50, 225, 3, '2026-09-21', '2026-09-21', 'Store in pastry refrigerator under 5°C.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('238042bd-229d-46db-82d7-c1621c138c41', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '2a870ecc-f046-4a4b-ae6d-1f2e29f325a9', 'Artisan Garlic & Herb Focaccia 300g', 'Traditional Italian flatbread infused with rosemary, roasted garlic, and extra virgin olive oil.', 140, 140, 50, 70, 7, '2026-09-22', '2026-09-22', 'Warm in an oven or toaster for 2 minutes before serving.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('3f3833de-2555-4fc6-abcf-ba4f4ac42a02', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '5769d072-5bbc-4028-8555-5608464f4310', 'Walnut Chocolate Fudge Brownie Pack of 2', 'Chewy, dense chocolate fudge brownies loaded with California walnuts.', 160, 160, 50, 80, 8, '2026-09-22', '2026-09-22', 'Microwave for 15 seconds for a molten center.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('f60999f9-6167-4d58-b2ea-94940fbcee33', '12c47191-2927-45aa-a790-94643e6987e6', 'a8a49467-18a4-4441-9675-e1ce7dd98faf', 'Grilled Paneer Tikka Sandwich', 'Tandoori marinated paneer cubes with mint chutney and melted cheddar on toasted sourdough.', 120, 120, 50, 60, 6, '2026-09-21', '2026-09-21', 'Consume immediately or reheat on grill pan.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('9195a63b-82a0-4f4b-8795-eef3bfc961cc', '12c47191-2927-45aa-a790-94643e6987e6', '1ee589a5-e259-41e3-866c-fd69445a041d', 'Raw Pressery Cold Brew Nitro Coffee 250ml', 'Slow-steeped Arabica coffee brewed for 18 hours. Smooth, bold, and low-acid kick.', 150, 150, 50, 75, 8, '2026-09-23', '2026-09-23', 'Shake well and serve ice cold.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('1a80e0c5-4265-4323-bc0c-e1407fe1e0b1', '12c47191-2927-45aa-a790-94643e6987e6', '5769d072-5bbc-4028-8555-5608464f4310', 'Warm Gulab Jamun in Saffron Syrup (Pack of 6)', 'Traditional khoya dumplings fried golden and soaked in aromatic cardamom-saffron syrup.', 200, 200, 40, 120, 5, '2026-09-24', '2026-09-24', 'Reheat slightly before serving for maximum softness.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('87bd23a2-ac7e-4939-bdd5-f5aea1dd6b0d', '2478c45f-9be0-4038-9ce8-c35335f1abd6', 'a8a49467-18a4-4441-9675-e1ce7dd98faf', 'Hyderabadi Paneer Dum Biryani Meal Box', 'Fragrant long-grain basmati rice layered with spiced paneer, fried onions, and saffron. Includes raita.', 260, 260, 50, 130, 7, '2026-09-21', '2026-09-21', 'Keep hot or reheat in microwave for 90 seconds.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('d24193ad-c880-4d46-890e-c5a5092a0557', '2478c45f-9be0-4038-9ce8-c35335f1abd6', '9fe91a8c-965e-48f6-9b72-b8e1fec72bba', 'ITC Master Chef Veggie Pizza Pockets 250g', 'Crisp golden crust pockets filled with mozzarella, corn, and tangy Italian marinara sauce.', 180, 180, 35, 117, 11, '2026-09-26', '2026-09-26', 'Store in deep freezer at -18°C or below.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO products (id, provider_id, category_id, name, description, mrp, original_price, discount_percent, discounted_price, quantity, best_before_date, expiry_date, storage_instructions, pickup_start_time, pickup_end_time, is_active, auto_discount, created_at, updated_at) VALUES ('3666cbc4-1858-4f83-82a6-d5baea6f21e4', '2478c45f-9be0-4038-9ce8-c35335f1abd6', 'cfdf14ff-b71d-41a3-80a5-c5a63d725655', 'Britannia Good Day Butter Cookies Box 600g', 'Rich buttery cookies with cashew accents, baked golden for tea-time crunch.', 120, 120, 30, 84, 16, '2026-10-01', '2026-10-01', 'Store in dry place away from direct sunlight.', '10:00', '21:00', 1, 1, '2026-09-21 16:29:55', '2026-09-21 16:29:55');

-- Table: product_images (16 rows)
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('a20ed8b5-06d3-47c4-93a6-edd76aa8ec18', '14896d70-09c4-4559-b9fb-a00d55e0bfed', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('0ba45a84-eb03-46db-81c5-f3c16fe6bbef', 'f3f4b94b-2226-4bde-9502-6cb61d42097e', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('3c222938-cfc9-4a2f-b7df-9f4dc7eaabfd', '4775d0f4-d3a0-4da0-8665-17eaaa147d8a', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('47862385-88c5-44d0-aac9-76e8803dbd7e', '7d03bc27-dc79-409a-8cfc-04294ea9f598', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('4524996a-671f-4b2b-9a99-7f26efdcf7dc', 'd6e08571-bdb9-44dd-bc2a-ff6fbbf3dd8a', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('a5ac88ee-e315-4fb1-b292-ff577c5154a8', 'ab45a750-8a58-4f5f-b162-ce10a41e151d', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('f05db396-4bf8-4038-b29d-db41a9e5808a', '712c8cfa-a485-4f64-9fdd-0c6f7218f3c0', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('3e8f2040-500d-43ff-ad79-0170e18703ab', '6c70641b-e3da-4de3-8440-3024604bcf56', 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('3d6d399e-0c1f-4bcd-81f5-76100cb558e2', '238042bd-229d-46db-82d7-c1621c138c41', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('2069f2c3-9c9a-48bf-b795-28e59e83f964', '3f3833de-2555-4fc6-abcf-ba4f4ac42a02', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('0a88d3b5-236f-4663-a789-6ef8bebf40a7', 'f60999f9-6167-4d58-b2ea-94940fbcee33', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('02a6e275-0975-49e0-9a01-6988be42b0d9', '9195a63b-82a0-4f4b-8795-eef3bfc961cc', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('8557e7fe-d56f-4601-ba42-51be77b98da5', '1a80e0c5-4265-4323-bc0c-e1407fe1e0b1', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('308e29ce-fc9e-4b5a-a65b-0ccd6fc3c61c', '87bd23a2-ac7e-4939-bdd5-f5aea1dd6b0d', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('4c2386aa-897c-4c6f-8f4c-3c3b4eb597a4', 'd24193ad-c880-4d46-890e-c5a5092a0557', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', 1, '2026-09-21 16:29:55');
INSERT INTO product_images (id, product_id, image_url, is_primary, created_at) VALUES ('302d4a77-8770-4238-9b34-fecd885a8a65', '3666cbc4-1858-4f83-82a6-d5baea6f21e4', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', 1, '2026-09-21 16:29:55');

-- Table: inventory (16 rows)
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('92a2dc99-4297-43be-a29c-4cec3e68c996', '14896d70-09c4-4559-b9fb-a00d55e0bfed', 5, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('0c1c4ab2-2afa-4e82-82dc-3a4f0989158b', 'f3f4b94b-2226-4bde-9502-6cb61d42097e', 8, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('fc40edce-eade-4d12-845e-29062dde4ee2', '4775d0f4-d3a0-4da0-8665-17eaaa147d8a', 10, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('68102739-d730-4092-9d82-5a230dbdff4c', '7d03bc27-dc79-409a-8cfc-04294ea9f598', 14, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('d2d48b59-507d-42e6-8cf1-b574f0bfe5ff', 'd6e08571-bdb9-44dd-bc2a-ff6fbbf3dd8a', 18, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('fcb3c24f-7648-4db2-8992-9cae1f727e4f', 'ab45a750-8a58-4f5f-b162-ce10a41e151d', 15, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('733be752-81c2-4507-ba7c-c540d9ac45c3', '712c8cfa-a485-4f64-9fdd-0c6f7218f3c0', 6, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('b0f5572f-cb19-4b0c-9411-dbb6da41e496', '6c70641b-e3da-4de3-8440-3024604bcf56', 3, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('ffc905a0-8add-4722-9f5f-1ebb02fd377b', '238042bd-229d-46db-82d7-c1621c138c41', 7, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('ba1824ca-2069-46b6-85c1-fc37c426259c', '3f3833de-2555-4fc6-abcf-ba4f4ac42a02', 8, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('4c942e97-3810-43be-93b3-42c9705fe272', 'f60999f9-6167-4d58-b2ea-94940fbcee33', 6, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('2571fd43-ed57-484c-a6d5-ab8e9b764298', '9195a63b-82a0-4f4b-8795-eef3bfc961cc', 8, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('2470800c-d17f-4bc8-82de-4597cb888a7d', '1a80e0c5-4265-4323-bc0c-e1407fe1e0b1', 5, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('a71cc551-d7e7-43b6-a53f-03e5e0e1ce22', '87bd23a2-ac7e-4939-bdd5-f5aea1dd6b0d', 7, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('6a1696b1-c58b-4793-bde5-2c12cf0c0f7c', 'd24193ad-c880-4d46-890e-c5a5092a0557', 11, 0, 0, '2026-09-21 16:29:55');
INSERT INTO inventory (id, product_id, available_quantity, reserved_quantity, sold_quantity, updated_at) VALUES ('b2bcf68c-18c7-452f-a779-98641e418c37', '3666cbc4-1858-4f83-82a6-d5baea6f21e4', 16, 0, 0, '2026-09-21 16:29:55');

-- Table: orders (3 rows)
INSERT INTO orders (id, order_number, customer_id, provider_id, subtotal, platform_fee, total_amount, status, pickup_start_time, pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone, created_at, updated_at) VALUES ('a21eb4d5-1db1-4001-9947-704383f9ced4', 'FD10293', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', 160, 5, 165, 'READY_FOR_PICKUP', '16:00', '20:00', '7392', '{"orderId":"a21eb4d5-1db1-4001-9947-704383f9ced4","orderNumber":"FD10293","pickupCode":"7392","providerId":"d7532028-b6c1-4aae-9df7-0f699f5dc320"}', 'Rahul Verma', '9876543210', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO orders (id, order_number, customer_id, provider_id, subtotal, platform_fee, total_amount, status, pickup_start_time, pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone, created_at, updated_at) VALUES ('2dcc5b60-78d8-4efb-bb6d-43227b32b5e1', 'FD10188', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', 225, 5, 230, 'PICKED_UP', '14:00', '18:00', '4819', '{"orderId":"2dcc5b60-78d8-4efb-bb6d-43227b32b5e1","orderNumber":"FD10188","pickupCode":"4819","providerId":"d7532028-b6c1-4aae-9df7-0f699f5dc320"}', 'Rahul Verma', '9876543210', '2026-09-21 16:29:55', '2026-09-21 16:29:55');
INSERT INTO orders (id, order_number, customer_id, provider_id, subtotal, platform_fee, total_amount, status, pickup_start_time, pickup_end_time, pickup_code, qr_code_data, customer_name, customer_phone, created_at, updated_at) VALUES ('426d721e-ed8e-415a-80f8-dda6c1bf5c41', 'FD52819', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', 90, 5, 95, 'PICKED_UP', '16:00', '20:00', '1574', '{"orderId":"426d721e-ed8e-415a-80f8-dda6c1bf5c41","orderNumber":"FD52819","pickupCode":"1574","providerId":"d7532028-b6c1-4aae-9df7-0f699f5dc320"}', 'Rahul Verma', '9876543210', '2026-09-21 16:29:55', '2026-09-21 16:29:55');

-- Table: order_items (3 rows)
INSERT INTO order_items (id, order_id, product_id, product_name, unit_original_price, unit_discounted_price, quantity, subtotal, created_at) VALUES ('b53ebd74-7b06-4401-b369-6d3ebd58ccb2', 'a21eb4d5-1db1-4001-9947-704383f9ced4', '712c8cfa-a485-4f64-9fdd-0c6f7218f3c0', 'Dutch Chocolate Truffle Pastry', 180, 90, 1, 90, '2026-09-21 16:29:55');
INSERT INTO order_items (id, order_id, product_id, product_name, unit_original_price, unit_discounted_price, quantity, subtotal, created_at) VALUES ('231ae2f7-b98c-4273-b32a-480126678d33', 'a21eb4d5-1db1-4001-9947-704383f9ced4', '6c70641b-e3da-4de3-8440-3024604bcf56', 'Belgian Dark Chocolate Cake 500g', 450, 225, 1, 225, '2026-09-21 16:29:55');
INSERT INTO order_items (id, order_id, product_id, product_name, unit_original_price, unit_discounted_price, quantity, subtotal, created_at) VALUES ('e525ef07-e770-4ed5-bad5-8223663c6287', '426d721e-ed8e-415a-80f8-dda6c1bf5c41', '712c8cfa-a485-4f64-9fdd-0c6f7218f3c0', 'Dutch Chocolate Truffle Pastry', 180, 90, 1, 90, '2026-09-21 16:29:55');

-- Table: payments (3 rows)
INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status, gateway_response, created_at) VALUES ('40e0d302-79f6-4c84-a96f-71233827f535', 'a21eb4d5-1db1-4001-9947-704383f9ced4', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 165, 'UPI (Google Pay)', 'TXN_SAMPLE_001', 'COMPLETED', NULL, '2026-09-21 16:29:55');
INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status, gateway_response, created_at) VALUES ('c5953c55-c620-4ea1-bfd8-e62d11099546', '2dcc5b60-78d8-4efb-bb6d-43227b32b5e1', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 230, 'UPI (PhonePe)', 'TXN_SAMPLE_002', 'COMPLETED', NULL, '2026-09-21 16:29:55');
INSERT INTO payments (id, order_id, customer_id, amount, payment_method, transaction_id, status, gateway_response, created_at) VALUES ('4821c41f-6034-4f1e-83fc-f85423a8babc', '426d721e-ed8e-415a-80f8-dda6c1bf5c41', '76d06bfd-e6c0-4ebe-a212-2238be6186ce', 95, 'UPI', 'TXN_1790008195948_545', 'COMPLETED', '{"verified":true,"method":"UPI"}', '2026-09-21 16:29:55');

-- Table: pickup_verifications (2 rows)
INSERT INTO pickup_verifications (id, order_id, provider_id, verified_by_user_id, verified_code, verification_method, verified_at, notes) VALUES ('2e9b43aa-f210-4f67-b742-dae83571c0ac', '2dcc5b60-78d8-4efb-bb6d-43227b32b5e1', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '988990d3-519f-443b-ba70-a0a5593659b5', '4819', 'CODE', '2026-09-21 16:29:55', 'Verified by store manager at checkout counter');
INSERT INTO pickup_verifications (id, order_id, provider_id, verified_by_user_id, verified_code, verification_method, verified_at, notes) VALUES ('0857bb4c-016f-4b93-ae50-e6888284575b', '426d721e-ed8e-415a-80f8-dda6c1bf5c41', 'd7532028-b6c1-4aae-9df7-0f699f5dc320', '988990d3-519f-443b-ba70-a0a5593659b5', '1574', 'CODE', '2026-09-21 16:29:55', 'Verified at store counter');

-- Table: notifications (6 rows)
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('a3baf055-4a64-4d05-9492-6600bc165f3c', '8dd87b35-4ab3-4004-8331-8bbc732d13a2', 'Order FD10293 Ready for Pickup!', 'Your rescued treats are packed and waiting at The Daily Crumb Bakery. Pickup Code: 7392.', 'order_update', 0, '/orders', '2026-09-21 16:29:55');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('1c40cc14-96f4-4531-b1cf-95e9713b7799', '988990d3-519f-443b-ba70-a0a5593659b5', '3 Listings Ending Today!', 'Keep an eye on today’s clearance pastries to ensure smooth customer pickups.', 'expiry_alert', 0, '/provider/products', '2026-09-21 16:29:55');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('3e6cdc7b-7c2c-491c-ac82-4ddc53a77985', '8dd87b35-4ab3-4004-8331-8bbc732d13a2', 'Order FD52819 Confirmed!', 'Your pickup code is 1574. Pick up from The Daily Crumb Bakery before 20:00.', 'order_update', 0, '/orders', '2026-09-21 16:29:55');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('5798d1c8-5239-4329-a5d0-fbb81b8371eb', '988990d3-519f-443b-ba70-a0a5593659b5', 'New Order Received (FD52819)', 'Rahul Verma purchased 1 rescued items (₹95).', 'order_update', 0, '/provider/orders', '2026-09-21 16:29:55');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('987528ad-4da6-4699-a917-e2fd3c41ff23', '8dd87b35-4ab3-4004-8331-8bbc732d13a2', 'Order FD52819 Collected!', 'Thank you for rescuing food with The Daily Crumb Bakery! Enjoy your meal.', 'order_update', 0, '/orders', '2026-09-21 16:29:55');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at) VALUES ('883f9411-abcf-4797-8987-fa1a2f8cbf13', '003f4e88-88fa-4c7c-8bfc-22f686781337', 'Provider Account Update', 'Congratulations! Your provider account \'Metro Grocery Depot\' has been APPROVED. You can now list surplus food products!', 'system', 0, '/provider', '2026-09-21 16:29:56');

-- Table: admin_users (1 rows)
INSERT INTO admin_users (id, user_id, department, access_level, created_at) VALUES ('fc68f1cc-5d46-4921-886e-72eaa7bce84c', '6fef4ce6-c17a-4118-9b9c-da42fbc32f30', 'Operations & Trust', 'SUPER_ADMIN', '2026-09-21 16:29:54');

SET FOREIGN_KEY_CHECKS = 1;
