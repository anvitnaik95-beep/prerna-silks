-- ============================================================
-- Prerna Silks - MySQL Database Schema
-- ============================================================
-- Run this in MySQL Workbench or phpMyAdmin (XAMPP)
-- ============================================================

CREATE DATABASE IF NOT EXISTS prerna_silks;
USE prerna_silks;

-- Users table (customers and admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  phone VARCHAR(20) DEFAULT '',
  address TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  original_price DECIMAL(10,2) DEFAULT 0.00,
  description TEXT DEFAULT NULL,
  image VARCHAR(500) DEFAULT '',
  rating DECIMAL(2,1) DEFAULT 4.0,
  category VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT 'Multi',
  occasion VARCHAR(50) DEFAULT 'Casual',
  pattern VARCHAR(50) DEFAULT 'Traditional',
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saree Details (linked to products)
CREATE TABLE IF NOT EXISTS saree_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  pattern VARCHAR(100) DEFAULT '',
  purity VARCHAR(100) DEFAULT '',
  color VARCHAR(100) DEFAULT '',
  fabric VARCHAR(100) DEFAULT '',
  length VARCHAR(50) DEFAULT '5.5 meters',
  work VARCHAR(100) DEFAULT '',
  border VARCHAR(100) DEFAULT '',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Blouse Details (linked to products)
CREATE TABLE IF NOT EXISTS blouse_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  border VARCHAR(100) DEFAULT '',
  work VARCHAR(100) DEFAULT '',
  fabric VARCHAR(100) DEFAULT '',
  length VARCHAR(50) DEFAULT '0.8 meters',
  pattern VARCHAR(100) DEFAULT '',
  color VARCHAR(100) DEFAULT '',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(50) DEFAULT 'COD',
  shipping_address TEXT DEFAULT NULL,
  status ENUM('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0.00,
  quantity INT DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) DEFAULT 'Anonymous',
  email VARCHAR(100) DEFAULT '',
  message TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments / Reviews
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  user_name VARCHAR(100) DEFAULT 'Customer',
  comment TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) DEFAULT '',
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) DEFAULT '',
  gst VARCHAR(50) DEFAULT '',
  status ENUM('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category ENUM('Rent', 'Salary', 'Electricity', 'Transport', 'Marketing', 'Packaging', 'Maintenance', 'Other') DEFAULT 'Other',
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE DEFAULT (CURRENT_DATE),
  payment_method VARCHAR(50) DEFAULT 'Cash',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin', 'admin@prernasilks.com', '$2a$10$8BOu.D5LZSu6TcFeUyF6BuEMrZ38Hyjagj466JZy22JAIElQDDasK', 'admin', '9876543210');

-- Sample customer (password: customer123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Priya Sharma', 'priya@example.com', '$2a$10$XCmbbkllMd1409ifE0W37e7wDeioDMJeKm3UscasHHUf72UC0Y/mm', 'customer', '9876543211');

-- Sample Products
INSERT INTO products (name, price, original_price, description, rating, category, color, occasion, pattern, stock, featured) VALUES
('Kanchipuram Silk Saree - Royal Blue', 15999, 19999, 'Exquisite Kanchipuram silk saree with rich zari work and traditional motifs.', 4.8, 'Silk', 'Blue', 'Wedding', 'Zari', 12, TRUE),
('Banarasi Silk Saree - Maroon Gold', 12999, 16999, 'Handwoven Banarasi silk saree with intricate gold zari patterns.', 4.7, 'Silk', 'Maroon', 'Wedding', 'Floral', 8, TRUE),
('Chanderi Cotton Saree - Pink', 3999, 5499, 'Lightweight Chanderi cotton saree with delicate golden booties.', 4.3, 'Cotton', 'Pink', 'Casual', 'Geometric', 25, FALSE),
('Chiffon Saree - Emerald Green', 2999, 4499, 'Elegant chiffon saree with sequin work. Perfect for parties.', 4.5, 'Chiffon', 'Green', 'Party', 'Sequin', 15, TRUE),
('Patola Silk Saree - Red Gold', 22999, 28999, 'Authentic double-ikat Patola silk saree from Gujarat.', 4.9, 'Silk', 'Red', 'Wedding', 'Ikat', 5, TRUE),
('Mysore Silk Saree - Purple', 8999, 11999, 'Government certified Mysore silk. Perfect for festivals.', 4.6, 'Silk', 'Purple', 'Festival', 'Plain', 18, FALSE),
('Tussar Silk Saree - Beige', 6999, 8999, 'Natural tussar silk with hand-painted Madhubani art.', 4.4, 'Silk', 'Beige', 'Casual', 'Painted', 10, FALSE),
('Organza Saree - Lavender', 4599, 6999, 'Trendy organza saree with floral print and embroidered border.', 4.2, 'Organza', 'Purple', 'Party', 'Floral', 20, TRUE),
('Linen Saree - Olive Green', 3499, 4999, 'Breathable linen saree perfect for summer.', 4.1, 'Linen', 'Green', 'Casual', 'Striped', 30, FALSE),
('Georgette Saree - Coral Peach', 5999, 7999, 'Flowing georgette saree with heavy embroidery work.', 4.5, 'Georgette', 'Orange', 'Party', 'Embroidered', 14, TRUE),
('Sambalpuri Cotton - White Red', 2799, 3999, 'Traditional Sambalpuri ikat cotton saree from Odisha.', 4.3, 'Cotton', 'White', 'Casual', 'Ikat', 22, FALSE),
('Pochampally Silk - Teal', 9999, 13999, 'Pochampally ikat silk saree with geometric patterns.', 4.7, 'Silk', 'Blue', 'Festival', 'Geometric', 7, TRUE);

-- Saree Details
INSERT INTO saree_details (product_id, pattern, purity, color, fabric, length, work, border) VALUES
(1, 'Traditional Zari', 'Pure Silk', 'Royal Blue', 'Kanchipuram Silk', '6.3 meters', 'Zari Weaving', 'Grand Temple Border'),
(2, 'Floral Jaal', 'Pure Silk', 'Deep Maroon', 'Banarasi Silk', '6.0 meters', 'Kadwa Weaving', 'Broad Zari Border'),
(3, 'Geometric Booties', 'Cotton Blend', 'Baby Pink', 'Chanderi Cotton', '5.5 meters', 'Handloom', 'Zari Border'),
(4, 'Sequin Scatter', 'Pure Chiffon', 'Emerald Green', 'Georgette Chiffon', '5.5 meters', 'Sequin & Thread', 'Lace Border'),
(5, 'Double Ikat', 'Pure Silk', 'Vermillion Red', 'Patola Silk', '5.5 meters', 'Double Ikat Weaving', 'Traditional Border'),
(6, 'Plain with Border', 'Pure Silk', 'Royal Purple', 'Mysore Silk', '6.0 meters', 'Machine Weaving', 'Gold Zari Border'),
(7, 'Madhubani Art', 'Pure Tussar', 'Natural Beige', 'Tussar Silk', '5.5 meters', 'Hand Painting', 'Thin Border'),
(8, 'Digital Floral', 'Pure Organza', 'Lavender', 'Organza', '5.5 meters', 'Digital Print', 'Embroidered Border'),
(9, 'Vertical Stripes', 'Pure Linen', 'Olive Green', 'Linen', '5.5 meters', 'Handloom', 'Self Border'),
(10, 'Jaal Embroidery', 'Pure Georgette', 'Coral Peach', 'Georgette', '5.5 meters', 'Thread & Sequin', 'Heavy Embroidered'),
(11, 'Bandha Ikat', 'Pure Cotton', 'White & Red', 'Sambalpuri Cotton', '5.5 meters', 'Ikat Weaving', 'Traditional Ikat'),
(12, 'Geometric Ikat', 'Pure Silk', 'Teal Blue', 'Pochampally Silk', '5.5 meters', 'Ikat Weaving', 'Contrast Border');

-- Blouse Details
INSERT INTO blouse_details (product_id, border, work, fabric, length, pattern, color) VALUES
(1, 'Contrast Border', 'Zari Work', 'Silk', '0.8 meters', 'Matching', 'Gold'),
(2, 'Zari Border', 'Embroidery', 'Silk', '0.8 meters', 'Self', 'Maroon'),
(3, 'Plain', 'None', 'Cotton', '0.8 meters', 'Plain', 'Pink'),
(4, 'Lace', 'Sequin', 'Chiffon', '0.8 meters', 'Embroidered', 'Green'),
(5, 'Matching', 'Ikat', 'Silk', '0.8 meters', 'Ikat', 'Red'),
(6, 'Contrast', 'None', 'Silk', '0.8 meters', 'Plain', 'Gold'),
(7, 'Painted', 'Hand Painted', 'Tussar', '0.8 meters', 'Artistic', 'Beige'),
(8, 'Embroidered', 'Thread Work', 'Raw Silk', '0.8 meters', 'Floral', 'Lavender'),
(9, 'Plain', 'None', 'Linen', '0.8 meters', 'Striped', 'Olive'),
(10, 'Embroidered', 'Mirror Work', 'Georgette', '0.8 meters', 'Heavy Work', 'Peach'),
(11, 'Ikat', 'Ikat', 'Cotton', '0.8 meters', 'Ikat', 'Red'),
(12, 'Contrast', 'Ikat', 'Silk', '0.8 meters', 'Geometric', 'Teal');
