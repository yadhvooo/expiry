-- ==========================================================
-- FOOD EXPIRY RESCUE MARKETPLACE - COMPLETE DATABASE SCHEMA
-- Compatible with PostgreSQL & SQLite
-- ==========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    default_address_id VARCHAR(36),
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (default_address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

-- 4. PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS providers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    business_type VARCHAR(50) NOT NULL, -- Supermarket, Bakery, Restaurant, Cloud Kitchen, Cafe, etc.
    license_number VARCHAR(100), -- FSSAI / Food license
    bank_account_details TEXT, -- Bank/UPI payout details
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    auto_discount_enabled BOOLEAN DEFAULT 1,
    commission_rate DECIMAL(5, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. PROVIDER DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS provider_documents (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- FSSAI, GST, Trade License, ID Proof
    document_url TEXT NOT NULL,
    verified_status VARCHAR(20) DEFAULT 'pending' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 6. CATEGORIES TABLE (STRICTLY NO FRUITS OR VEGETABLES)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mrp DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    discounted_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    best_before_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    storage_instructions TEXT,
    pickup_start_time VARCHAR(10) DEFAULT '10:00',
    pickup_end_time VARCHAR(10) DEFAULT '21:00',
    is_active BOOLEAN DEFAULT 1,
    auto_discount BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 8. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 9. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) UNIQUE NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    sold_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL, -- e.g. #FD10293
    customer_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 5.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'REFUNDED')),
    pickup_start_time VARCHAR(50),
    pickup_end_time VARCHAR(50),
    pickup_code VARCHAR(10) NOT NULL, -- 4-digit code e.g. 7392
    qr_code_data TEXT NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE RESTRICT
);

-- 11. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_original_price DECIMAL(10, 2) NOT NULL,
    unit_discounted_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 12. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- UPI, CARD, NETBANKING, CASH_ON_PICKUP
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- 13. PICKUP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS pickup_verifications (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    verified_by_user_id VARCHAR(36) NOT NULL,
    verified_code VARCHAR(10) NOT NULL,
    verification_method VARCHAR(20) DEFAULT 'CODE' CHECK (verification_method IN ('CODE', 'QR_SCAN')),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 14. DISCOUNT RULES TABLE
CREATE TABLE IF NOT EXISTS discount_rules (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36), -- NULL means platform default
    rule_name VARCHAR(100) NOT NULL,
    days_remaining_min INT NOT NULL,
    days_remaining_max INT NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 15. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE RESTRICT
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- order_update, expiry_alert, stock_alert, system
    is_read BOOLEAN DEFAULT 0,
    link_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    department VARCHAR(100) DEFAULT 'Marketplace Operations',
    access_level VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================================
-- INDEXES FOR HIGH-PERFORMANCE DISCOVERY AND RELIABILITY
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_lat_lng ON providers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
