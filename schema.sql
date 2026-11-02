-- CivicConnect MySQL Database Schema
-- Aligned with SDG 11: Sustainable Cities & Communities
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS civicconnect_db;
USE civicconnect_db;

-- 1. Users Table (Citizens, Municipal Officers, Field Supervisors, Admins)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'officer', 'supervisor', 'admin') NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Issue Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  description TEXT
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  citizen_id VARCHAR(36) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) DEFAULT 12.97160000,
  longitude DECIMAL(11, 8) DEFAULT 77.59460000,
  status ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  reported_date DATE NOT NULL,
  last_updated DATE NOT NULL,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. Complaint Photos Table
CREATE TABLE IF NOT EXISTS complaint_photos (
  id VARCHAR(36) PRIMARY KEY,
  complaint_id VARCHAR(36) NOT NULL,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 5. Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(36) PRIMARY KEY,
  complaint_id VARCHAR(36) NOT NULL,
  department VARCHAR(100) NOT NULL,
  supervisor_id VARCHAR(36) NOT NULL,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  deadline DATE NOT NULL,
  description TEXT,
  status ENUM('ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'VERIFIED') DEFAULT 'ASSIGNED',
  progress INT DEFAULT 0,
  before_photo TEXT DEFAULT NULL,
  after_photo TEXT DEFAULT NULL,
  verification_status ENUM('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REWORK_REQUESTED') DEFAULT 'NOT_SUBMITTED',
  rejection_reason TEXT DEFAULT NULL,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- 6. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  min_threshold INT DEFAULT 10,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Material Requests Table
CREATE TABLE IF NOT EXISTS material_requests (
  id VARCHAR(36) PRIMARY KEY,
  work_order_id VARCHAR(36) NOT NULL,
  material_name VARCHAR(100) NOT NULL,
  quantity_requested INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
  reason TEXT,
  status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_APPROVAL',
  approved_quantity INT DEFAULT 0,
  request_date DATE NOT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- 8. Feedback Table (Citizen 1-5 Star Ratings)
CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(36) PRIMARY KEY,
  complaint_id VARCHAR(36) NOT NULL UNIQUE,
  citizen_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id)
);
