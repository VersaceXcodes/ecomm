-- Create Tables

CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

CREATE TABLE admin_users (
    admin_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'admin',
    permissions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
    category_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL
);

CREATE TABLE products (
    product_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(255) NOT NULL,
    fragrance_notes_top JSONB DEFAULT '[]',
    fragrance_notes_middle JSONB DEFAULT '[]',
    fragrance_notes_base JSONB DEFAULT '[]',
    size_volume VARCHAR(100) NOT NULL,
    category_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    meta_title VARCHAR(500),
    meta_description TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE product_images (
    image_id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    alt_text VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE addresses (
    address_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    street_address_1 VARCHAR(500) NOT NULL,
    street_address_2 VARCHAR(500),
    city VARCHAR(255) NOT NULL,
    state_province VARCHAR(255) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    country VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE cart_items (
    cart_item_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    product_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE orders (
    order_id VARCHAR(255) PRIMARY KEY,
    order_number VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    guest_email VARCHAR(255),
    status VARCHAR(100) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(100) NOT NULL,
    payment_status VARCHAR(100) NOT NULL DEFAULT 'pending',
    payment_transaction_id VARCHAR(255),
    shipping_address_id VARCHAR(255) NOT NULL,
    billing_address_id VARCHAR(255) NOT NULL,
    shipping_method VARCHAR(255) NOT NULL,
    tracking_number VARCHAR(255),
    estimated_delivery_date VARCHAR(255),
    delivered_at VARCHAR(255),
    notes TEXT,
    promo_code VARCHAR(100),
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id)
);

CREATE TABLE order_items (
    order_item_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_brand VARCHAR(255) NOT NULL,
    product_sku VARCHAR(255) NOT NULL,
    product_image_url VARCHAR(1000),
    product_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    quantity INTEGER NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE wishlist_items (
    wishlist_item_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    added_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE product_reviews (
    review_id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    rating INTEGER NOT NULL,
    title VARCHAR(500),
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    admin_response TEXT,
    helpful_votes INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE guest_addresses (
    guest_address_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    street_address_1 VARCHAR(500) NOT NULL,
    street_address_2 VARCHAR(500),
    city VARCHAR(255) NOT NULL,
    state_province VARCHAR(255) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    country VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE newsletter_subscriptions (
    subscription_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_at VARCHAR(255) NOT NULL,
    unsubscribed_at VARCHAR(255)
);

CREATE TABLE contact_messages (
    message_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(100) NOT NULL DEFAULT 'new',
    admin_response TEXT,
    created_at VARCHAR(255) NOT NULL,
    updated_at VARCHAR(255) NOT NULL
);

CREATE TABLE shipping_methods (
    shipping_method_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL,
    estimated_days_min INTEGER NOT NULL,
    estimated_days_max INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(255) NOT NULL
);

CREATE TABLE promo_codes (
    promo_code_id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2),
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    starts_at VARCHAR(255) NOT NULL,
    expires_at VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL
);

CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    token_hash VARCHAR(500) NOT NULL,
    expires_at VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE admin_sessions (
    admin_session_id VARCHAR(255) PRIMARY KEY,
    admin_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(500) NOT NULL,
    expires_at VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
);

CREATE TABLE order_status_history (
    status_history_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    old_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_by_admin_id VARCHAR(255),
    notes TEXT,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (changed_by_admin_id) REFERENCES admin_users(admin_id)
);

CREATE TABLE inventory_adjustments (
    adjustment_id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    adjustment_type VARCHAR(100) NOT NULL,
    quantity_change INTEGER NOT NULL,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    admin_id VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
);

-- Seed Data

-- Insert Admin Users
INSERT INTO admin_users (admin_id, username, email, password_hash, role, permissions, is_active, created_at, updated_at) VALUES
('admin_001', 'superadmin', 'admin@perfumeria.com', 'admin123', 'super_admin', '["all"]', TRUE, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('admin_002', 'manager', 'manager@perfumeria.com', 'manager123', 'manager', '["products", "orders", "inventory"]', TRUE, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
('admin_003', 'support', 'support@perfumeria.com', 'support123', 'support', '["orders", "customers"]', TRUE, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

-- Insert Users
INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, email_verified, is_active, created_at, updated_at) VALUES
('user_001', 'john.doe@email.com', 'password123', 'John', 'Doe', '+1-555-0101', TRUE, TRUE, '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z'),
('user_002', 'jane.smith@email.com', 'password123', 'Jane', 'Smith', '+1-555-0102', TRUE, TRUE, '2024-01-16T14:20:00Z', '2024-01-16T14:20:00Z'),
('user_003', 'mike.johnson@email.com', 'password123', 'Mike', 'Johnson', '+1-555-0103', FALSE, TRUE, '2024-01-17T09:15:00Z', '2024-01-17T09:15:00Z'),
('user_004', 'sarah.wilson@email.com', 'password123', 'Sarah', 'Wilson', '+1-555-0104', TRUE, TRUE, '2024-01-18T16:45:00Z', '2024-01-18T16:45:00Z'),
('user_005', 'david.brown@email.com', 'password123', 'David', 'Brown', '+1-555-0105', TRUE, TRUE, '2024-01-19T11:30:00Z', '2024-01-19T11:30:00Z');

-- Insert Categories
INSERT INTO categories (category_id, name, description, display_order, is_active, created_at) VALUES
('cat_001', 'Men''s Fragrances', 'Premium fragrances for men', 1, TRUE, '2024-01-01T00:00:00Z'),
('cat_002', 'Women''s Fragrances', 'Elegant perfumes for women', 2, TRUE, '2024-01-01T00:00:00Z'),
('cat_003', 'Unisex Fragrances', 'Versatile scents for everyone', 3, TRUE, '2024-01-01T00:00:00Z'),
('cat_004', 'Niche Perfumes', 'Exclusive and rare fragrances', 4, TRUE, '2024-01-01T00:00:00Z'),
('cat_005', 'Gift Sets', 'Perfect fragrance gift combinations', 5, TRUE, '2024-01-01T00:00:00Z');

-- Insert Products
INSERT INTO products (product_id, name, description, price, sale_price, stock_quantity, sku, brand, fragrance_notes_top, fragrance_notes_middle, fragrance_notes_base, size_volume, category_id, is_active, is_featured, meta_title, meta_description, view_count, sales_count, created_at, updated_at) VALUES
('prod_001', 'Bleu de Chanel', 'A woody aromatic fragrance that captures the spirit of a man who chooses his own destiny', 89.99, 79.99, 50, 'BDC_50ML', 'Chanel', '["citrus", "mint", "lemon"]', '["nutmeg", "jasmine", "white woods"]', '["cedar", "sandalwood", "amber"]', '50ml', 'cat_001', TRUE, TRUE, 'Bleu de Chanel 50ml - Premium Men''s Fragrance', 'Experience the sophisticated scent of Bleu de Chanel', 1250, 85, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_002', 'Coco Mademoiselle', 'A spirited and voluptuous scent that is unmistakably feminine', 95.99, NULL, 35, 'COCM_50ML', 'Chanel', '["orange", "bergamot", "orange blossom"]', '["jasmine", "rose", "mimosa"]', '["patchouli", "vetiver", "vanilla"]', '50ml', 'cat_002', TRUE, TRUE, 'Coco Mademoiselle 50ml - Elegant Women''s Perfume', 'Discover the alluring charm of Coco Mademoiselle', 980, 67, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_003', 'Sauvage', 'A radical interpretation of freshness, inspired by wide open spaces', 75.99, 65.99, 75, 'SAU_60ML', 'Dior', '["bergamot", "pepper"]', '["lavender", "star anise", "nutmeg"]', '["amberwood", "cedar", "labdanum"]', '60ml', 'cat_001', TRUE, TRUE, 'Dior Sauvage 60ml - Fresh Men''s Cologne', 'Experience the wild freshness of Dior Sauvage', 1450, 120, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_004', 'Miss Dior', 'A scent that blooms with audacious femininity and elegance', 85.99, NULL, 40, 'MISD_50ML', 'Dior', '["blood orange", "mandarin", "pink pepper"]', '["grasse rose", "peony", "lily of the valley"]', '["patchouli", "rosewood", "musk"]', '50ml', 'cat_002', TRUE, FALSE, 'Miss Dior 50ml - Romantic Women''s Fragrance', 'Embrace femininity with Miss Dior perfume', 750, 45, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_005', 'Oud Wood', 'A modern interpretation of the precious oud wood', 299.99, NULL, 15, 'OUDW_50ML', 'Tom Ford', '["rosewood", "cardamom", "chinese pepper"]', '["oud wood", "sandalwood", "sichuan pepper"]', '["vanilla", "amber", "tonka bean"]', '50ml', 'cat_004', TRUE, TRUE, 'Tom Ford Oud Wood 50ml - Luxury Niche Fragrance', 'Indulge in the luxury of Tom Ford Oud Wood', 450, 12, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_006', 'Black Opium', 'A highly addictive gourmand fragrance for the modern femme fatale', 79.99, 69.99, 60, 'BLOP_50ML', 'Yves Saint Laurent', '["pink pepper", "orange blossom", "pear"]', '["jasmine", "coffee", "bitter almond"]', '["vanilla", "patchouli", "cedar"]', '50ml', 'cat_002', TRUE, FALSE, 'YSL Black Opium 50ml - Seductive Women''s Perfume', 'Unleash your seductive side with Black Opium', 820, 55, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_007', 'Aventus', 'A legendary fragrance that embodies strength, power and success', 379.99, NULL, 25, 'AVEN_50ML', 'Creed', '["blackcurrant", "italian bergamot", "french apples", "pineapple"]', '["dry birch", "patchouli", "moroccan jasmine", "rose"]', '["musk", "oakmoss", "ambergris", "vanilla"]', '50ml', 'cat_001', TRUE, TRUE, 'Creed Aventus 50ml - Iconic Men''s Fragrance', 'Experience the legendary scent of Creed Aventus', 2100, 35, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z'),
('prod_008', 'CK One', 'A clean, unisex fragrance that defies convention', 45.99, 39.99, 100, 'CK1_100ML', 'Calvin Klein', '["lemon", "bergamot", "cardamom", "fresh pineapple"]', '["nutmeg", "violet", "orris root", "jasmine", "lily of the valley", "rose"]', '["sandalwood", "amber", "musk", "cedar", "oakmoss"]', '100ml', 'cat_003', TRUE, FALSE, 'Calvin Klein CK One 100ml - Classic Unisex Fragrance', 'The original shared fragrance for everyone', 650, 90, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z');

-- Insert Product Images
INSERT INTO product_images (image_id, product_id, image_url, alt_text, display_order, is_primary, created_at) VALUES
('img_001', 'prod_001', 'https://picsum.photos/400/400?random=1', 'Bleu de Chanel bottle front view', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_002', 'prod_001', 'https://picsum.photos/400/400?random=2', 'Bleu de Chanel bottle side view', 1, FALSE, '2024-01-02T00:00:00Z'),
('img_003', 'prod_002', 'https://picsum.photos/400/400?random=3', 'Coco Mademoiselle bottle front view', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_004', 'prod_002', 'https://picsum.photos/400/400?random=4', 'Coco Mademoiselle bottle packaging', 1, FALSE, '2024-01-02T00:00:00Z'),
('img_005', 'prod_003', 'https://picsum.photos/400/400?random=5', 'Dior Sauvage bottle front view', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_006', 'prod_003', 'https://picsum.photos/400/400?random=6', 'Dior Sauvage bottle detail', 1, FALSE, '2024-01-02T00:00:00Z'),
('img_007', 'prod_004', 'https://picsum.photos/400/400?random=7', 'Miss Dior bottle front view', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_008', 'prod_005', 'https://picsum.photos/400/400?random=8', 'Tom Ford Oud Wood bottle', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_009', 'prod_006', 'https://picsum.photos/400/400?random=9', 'YSL Black Opium bottle', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_010', 'prod_007', 'https://picsum.photos/400/400?random=10', 'Creed Aventus bottle', 0, TRUE, '2024-01-02T00:00:00Z'),
('img_011', 'prod_008', 'https://picsum.photos/400/400?random=11', 'Calvin Klein CK One bottle', 0, TRUE, '2024-01-02T00:00:00Z');

-- Insert Addresses
INSERT INTO addresses (address_id, user_id, type, first_name, last_name, street_address_1, street_address_2, city, state_province, postal_code, country, phone, is_default, created_at, updated_at) VALUES
('addr_001', 'user_001', 'shipping', 'John', 'Doe', '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'USA', '+1-555-0101', TRUE, '2024-01-15T10:45:00Z', '2024-01-15T10:45:00Z'),
('addr_002', 'user_001', 'billing', 'John', 'Doe', '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'USA', '+1-555-0101', FALSE, '2024-01-15T10:45:00Z', '2024-01-15T10:45:00Z'),
('addr_003', 'user_002', 'shipping', 'Jane', 'Smith', '456 Oak Avenue', NULL, 'Los Angeles', 'CA', '90210', 'USA', '+1-555-0102', TRUE, '2024-01-16T15:00:00Z', '2024-01-16T15:00:00Z'),
('addr_004', 'user_003', 'shipping', 'Mike', 'Johnson', '789 Pine Road', 'Suite 200', 'Chicago', 'IL', '60601', 'USA', '+1-555-0103', TRUE, '2024-01-17T10:00:00Z', '2024-01-17T10:00:00Z'),
('addr_005', 'user_004', 'shipping', 'Sarah', 'Wilson', '321 Elm Street', NULL, 'Miami', 'FL', '33101', 'USA', '+1-555-0104', TRUE, '2024-01-18T17:00:00Z', '2024-01-18T17:00:00Z');

-- Insert Shipping Methods
INSERT INTO shipping_methods (shipping_method_id, name, description, cost, estimated_days_min, estimated_days_max, is_active, display_order, created_at) VALUES
('ship_001', 'Standard Shipping', 'Free shipping on orders over $50', 0.00, 5, 7, TRUE, 1, '2024-01-01T00:00:00Z'),
('ship_002', 'Express Shipping', 'Fast delivery in 2-3 business days', 9.99, 2, 3, TRUE, 2, '2024-01-01T00:00:00Z'),
('ship_003', 'Overnight Shipping', 'Next business day delivery', 24.99, 1, 1, TRUE, 3, '2024-01-01T00:00:00Z');

-- Insert Promo Codes
INSERT INTO promo_codes (promo_code_id, code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, usage_count, starts_at, expires_at, is_active, created_at) VALUES
('promo_001', 'WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, 50.00, 20.00, NULL, 45, '2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', TRUE, '2024-01-01T00:00:00Z'),
('promo_002', 'SAVE20', 'Save $20 on orders over $100', 'fixed', 20.00, 100.00, NULL, 1000, 123, '2024-01-01T00:00:00Z', '2024-06-30T23:59:59Z', TRUE, '2024-01-01T00:00:00Z'),
('promo_003', 'FREESHIP', 'Free shipping on any order', 'shipping', 0.00, 0.00, NULL, NULL, 67, '2024-01-01T00:00:00Z', NULL, TRUE, '2024-01-01T00:00:00Z');

-- Insert Orders
INSERT INTO orders (order_id, order_number, user_id, guest_email, status, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, currency, payment_method, payment_status, payment_transaction_id, shipping_address_id, billing_address_id, shipping_method, tracking_number, estimated_delivery_date, delivered_at, notes, promo_code, created_at, updated_at) VALUES
('order_001', 'ORD-2024-001', 'user_001', NULL, 'delivered', 169.98, 0.00, 13.60, 16.99, 166.59, 'USD', 'credit_card', 'paid', 'txn_abc123', 'addr_001', 'addr_002', 'Standard Shipping', 'TRK123456789', '2024-01-25T00:00:00Z', '2024-01-24T14:30:00Z', 'Customer requested gift wrapping', 'WELCOME10', '2024-01-20T10:00:00Z', '2024-01-24T14:30:00Z'),
('order_002', 'ORD-2024-002', 'user_002', NULL, 'shipped', 95.99, 9.99, 8.48, 0.00, 114.46, 'USD', 'paypal', 'paid', 'txn_def456', 'addr_003', 'addr_003', 'Express Shipping', 'TRK987654321', '2024-01-30T00:00:00Z', NULL, NULL, NULL, '2024-01-22T14:30:00Z', '2024-01-22T16:45:00Z'),
('order_003', 'ORD-2024-003', 'user_003', NULL, 'processing', 75.99, 0.00, 6.08, 0.00, 82.07, 'USD', 'credit_card', 'paid', 'txn_ghi789', 'addr_004', 'addr_004', 'Standard Shipping', NULL, '2024-02-02T00:00:00Z', NULL, 'Rush order', NULL, '2024-01-25T09:15:00Z', '2024-01-25T09:15:00Z');

-- Insert Order Items
INSERT INTO order_items (order_item_id, order_id, product_id, product_name, product_brand, product_sku, product_image_url, product_price, sale_price, quantity, line_total, created_at) VALUES
('oi_001', 'order_001', 'prod_001', 'Bleu de Chanel', 'Chanel', 'BDC_50ML', 'https://picsum.photos/400/400?random=1', 89.99, 79.99, 1, 79.99, '2024-01-20T10:00:00Z'),
('oi_002', 'order_001', 'prod_003', 'Sauvage', 'Dior', 'SAU_60ML', 'https://picsum.photos/400/400?random=5', 75.99, 65.99, 1, 65.99, '2024-01-20T10:00:00Z'),
('oi_003', 'order_001', 'prod_008', 'CK One', 'Calvin Klein', 'CK1_100ML', 'https://picsum.photos/400/400?random=11', 45.99, 39.99, 1, 39.99, '2024-01-20T10:00:00Z'),
('oi_004', 'order_002', 'prod_002', 'Coco Mademoiselle', 'Chanel', 'COCM_50ML', 'https://picsum.photos/400/400?random=3', 95.99, NULL, 1, 95.99, '2024-01-22T14:30:00Z'),
('oi_005', 'order_003', 'prod_003', 'Sauvage', 'Dior', 'SAU_60ML', 'https://picsum.photos/400/400?random=5', 75.99, 65.99, 1, 65.99, '2024-01-25T09:15:00Z');

-- Insert Cart Items
INSERT INTO cart_items (cart_item_id, user_id, session_id, product_id, quantity, added_at, updated_at) VALUES
('cart_001', 'user_004', NULL, 'prod_005', 1, '2024-01-26T10:30:00Z', '2024-01-26T10:30:00Z'),
('cart_002', 'user_005', NULL, 'prod_006', 2, '2024-01-26T15:45:00Z', '2024-01-26T15:45:00Z'),
('cart_003', NULL, 'sess_guest_001', 'prod_007', 1, '2024-01-26T18:20:00Z', '2024-01-26T18:20:00Z');

-- Insert Wishlist Items
INSERT INTO wishlist_items (wishlist_item_id, user_id, product_id, added_at) VALUES
('wish_001', 'user_001', 'prod_005', '2024-01-21T12:00:00Z'),
('wish_002', 'user_002', 'prod_007', '2024-01-23T16:30:00Z'),
('wish_003', 'user_003', 'prod_002', '2024-01-24T09:45:00Z'),
('wish_004', 'user_004', 'prod_007', '2024-01-25T14:20:00Z');

-- Insert Product Reviews
INSERT INTO product_reviews (review_id, product_id, user_id, order_id, rating, title, comment, is_verified_purchase, is_approved, admin_response, helpful_votes, created_at, updated_at) VALUES
('rev_001', 'prod_001', 'user_001', 'order_001', 5, 'Amazing fragrance!', 'This is hands down the best cologne I''ve ever owned. The scent lasts all day and I constantly get compliments.', TRUE, TRUE, 'Thank you for your review!', 12, '2024-01-25T10:00:00Z', '2024-01-25T10:00:00Z'),
('rev_002', 'prod_003', 'user_001', 'order_001', 4, 'Great everyday scent', 'Perfect for daily wear. Fresh and not overpowering. Would definitely recommend.', TRUE, TRUE, NULL, 8, '2024-01-25T10:15:00Z', '2024-01-25T10:15:00Z'),
('rev_003', 'prod_002', 'user_002', 'order_002', 5, 'Elegant and sophisticated', 'This perfume is absolutely divine. It''s feminine yet powerful, perfect for any occasion.', TRUE, TRUE, 'We''re so glad you love it!', 15, '2024-01-28T14:00:00Z', '2024-01-28T14:00:00Z'),
('rev_004', 'prod_001', 'user_005', NULL, 3, 'Decent but overpriced', 'It''s a nice fragrance but I think there are better options for the price point.', FALSE, TRUE, NULL, 3, '2024-01-26T11:30:00Z', '2024-01-26T11:30:00Z');

-- Insert Newsletter Subscriptions
INSERT INTO newsletter_subscriptions (subscription_id, email, is_active, subscribed_at, unsubscribed_at) VALUES
('news_001', 'john.doe@email.com', TRUE, '2024-01-15T10:30:00Z', NULL),
('news_002', 'jane.smith@email.com', TRUE, '2024-01-16T14:20:00Z', NULL),
('news_003', 'newsletter@example.com', TRUE, '2024-01-17T09:00:00Z', NULL),
('news_004', 'subscriber@test.com', FALSE, '2024-01-18T12:00:00Z', '2024-01-25T15:30:00Z'),
('news_005', 'perfumelover@email.com', TRUE, '2024-01-19T16:45:00Z', NULL);

-- Insert Contact Messages
INSERT INTO contact_messages (message_id, name, email, phone, subject, message, status, admin_response, created_at, updated_at) VALUES
('msg_001', 'Robert Chen', 'robert.chen@email.com', '+1-555-0201', 'Question about shipping', 'Hi, I''d like to know more about your international shipping options. Do you ship to Canada?', 'resolved', 'Yes, we do ship to Canada! Shipping typically takes 7-10 business days.', '2024-01-20T09:30:00Z', '2024-01-20T14:00:00Z'),
('msg_002', 'Lisa Garcia', 'lisa.garcia@email.com', '+1-555-0202', 'Product availability', 'When will the Tom Ford Black Orchid be back in stock?', 'pending', NULL, '2024-01-24T11:15:00Z', '2024-01-24T11:15:00Z'),
('msg_003', 'Mark Thompson', 'mark.t@email.com', NULL, 'Return policy question', 'What is your return policy for opened fragrances?', 'new', NULL, '2024-01-26T15:20:00Z', '2024-01-26T15:20:00Z');

-- Insert Order Status History
INSERT INTO order_status_history (status_history_id, order_id, old_status, new_status, changed_by_admin_id, notes, created_at) VALUES
('osh_001', 'order_001', NULL, 'pending', NULL, 'Order placed', '2024-01-20T10:00:00Z'),
('osh_002', 'order_001', 'pending', 'processing', 'admin_002', 'Payment confirmed, preparing for shipment', '2024-01-20T14:30:00Z'),
('osh_003', 'order_001', 'processing', 'shipped', 'admin_002', 'Package shipped with tracking number', '2024-01-21T09:00:00Z'),
('osh_004', 'order_001', 'shipped', 'delivered', NULL, 'Package delivered successfully', '2024-01-24T14:30:00Z'),
('osh_005', 'order_002', NULL, 'pending', NULL, 'Order placed', '2024-01-22T14:30:00Z'),
('osh_006', 'order_002', 'pending', 'processing', 'admin_003', 'Payment verified', '2024-01-22T16:00:00Z'),
('osh_007', 'order_002', 'processing', 'shipped', 'admin_002', 'Express shipping initiated', '2024-01-22T16:45:00Z');

-- Insert Inventory Adjustments
INSERT INTO inventory_adjustments (adjustment_id, product_id, adjustment_type, quantity_change, old_quantity, new_quantity, reason, admin_id, created_at) VALUES
('inv_001', 'prod_001', 'sale', -1, 51, 50, 'Order #ORD-2024-001', NULL, '2024-01-20T10:00:00Z'),
('inv_002', 'prod_003', 'sale', -1, 76, 75, 'Order #ORD-2024-001', NULL, '2024-01-20T10:00:00Z'),
('inv_003', 'prod_008', 'sale', -1, 101, 100, 'Order #ORD-2024-001', NULL, '2024-01-20T10:00:00Z'),
('inv_004', 'prod_002', 'sale', -1, 36, 35, 'Order #ORD-2024-002', NULL, '2024-01-22T14:30:00Z'),
('inv_005', 'prod_005', 'restock', 5, 10, 15, 'Supplier delivery', 'admin_002', '2024-01-23T10:00:00Z'),
('inv_006', 'prod_007', 'adjustment', -2, 27, 25, 'Damaged during transport', 'admin_002', '2024-01-24T09:30:00Z');

-- Insert User Sessions
INSERT INTO user_sessions (session_id, user_id, token_hash, expires_at, ip_address, user_agent, is_active, created_at) VALUES
('sess_001', 'user_001', 'hash_token_abc123', '2024-02-15T10:30:00Z', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, '2024-01-15T10:30:00Z'),
('sess_002', 'user_002', 'hash_token_def456', '2024-02-16T14:20:00Z', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', TRUE, '2024-01-16T14:20:00Z'),
('sess_003', 'user_003', 'hash_token_ghi789', '2024-02-17T09:15:00Z', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', FALSE, '2024-01-17T09:15:00Z');

-- Insert Admin Sessions
INSERT INTO admin_sessions (admin_session_id, admin_id, token_hash, expires_at, ip_address, user_agent, is_active, created_at) VALUES
('admin_sess_001', 'admin_001', 'admin_hash_abc123', '2024-02-01T08:00:00Z', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, '2024-01-01T08:00:00Z'),
('admin_sess_002', 'admin_002', 'admin_hash_def456', '2024-02-02T09:00:00Z', '10.0.0.51', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', TRUE, '2024-01-02T09:00:00Z');