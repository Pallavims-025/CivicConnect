-- =============================================================================
-- CivicConnect: Civic Issue Reporting & Municipal Accountability Platform
-- Database Schema Definition for MySQL 8.x (InnoDB Engine, utf8mb4)
-- File: database/schema.sql
-- =============================================================================

-- Ensure strict SQL mode and character encoding
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------------------------------
-- 1. Database Creation
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `civicconnect`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `civicconnect`;

-- =============================================================================
-- SAFE EXECUTION POLICY:
-- By default, this script creates tables IF NOT EXISTS and does NOT drop
-- or destroy existing data.
--
-- If an explicit clean teardown is required in a development environment,
-- uncomment and execute the following DROP TABLE block deliberately:
--
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS `audit_logs`;
-- DROP TABLE IF EXISTS `duplicate_reviews`;
-- DROP TABLE IF EXISTS `notifications`;
-- DROP TABLE IF EXISTS `inventory_transactions`;
-- DROP TABLE IF EXISTS `material_request_items`;
-- DROP TABLE IF EXISTS `material_requests`;
-- DROP TABLE IF EXISTS `inventory_items`;
-- DROP TABLE IF EXISTS `feedback`;
-- DROP TABLE IF EXISTS `repair_verifications`;
-- DROP TABLE IF EXISTS `work_orders`;
-- DROP TABLE IF EXISTS `complaint_status_history`;
-- DROP TABLE IF EXISTS `complaint_photos`;
-- DROP TABLE IF EXISTS `complaints`;
-- DROP TABLE IF EXISTS `users`;
-- DROP TABLE IF EXISTS `categories`;
-- DROP TABLE IF EXISTS `departments`;
-- SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2. Table: departments (1 of 16)
-- Municipal departments responsible for handling different complaint categories.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `contact_email` VARCHAR(191) NULL,
  `contact_phone` VARCHAR(50) NULL,
  `head_officer_id` BIGINT UNSIGNED NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_departments_code` (`code`),
  UNIQUE KEY `uq_departments_name` (`name`),
  KEY `idx_departments_head_officer` (`head_officer_id`),
  KEY `idx_departments_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: categories (2 of 16)
-- Categories of civic issues (e.g. Roads & Potholes, Garbage & Waste, etc.).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(50) NULL,
  `department_id` INT UNSIGNED NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`),
  KEY `idx_categories_department` (`department_id`),
  KEY `idx_categories_active` (`is_active`),
  CONSTRAINT `fk_categories_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: users (3 of 16)
-- Stores Citizens, Municipal Officers, and Municipal Administrators.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_code` VARCHAR(50) NOT NULL,
  `role` ENUM('CITIZEN', 'OFFICER', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `password_hash` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(1000) NULL,
  `ward` VARCHAR(100) NULL,
  `address` VARCHAR(500) NULL,
  `title` VARCHAR(150) NULL,
  `department_id` INT UNSIGNED NULL,
  `ward_coverage` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `joined_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_code` (`user_code`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_department` (`department_id`),
  KEY `idx_users_ward` (`ward`),
  CONSTRAINT `fk_users_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Safe deferred foreign key: departments.head_officer_id -> users.id
-- Prevents circular dependency at table creation; safe for repeated executions.
-- -----------------------------------------------------------------------------
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'departments'
    AND CONSTRAINT_NAME = 'fk_departments_head_officer'
);

SET @sql_cmd = IF(
  @fk_exists = 0,
  'ALTER TABLE `departments` ADD CONSTRAINT `fk_departments_head_officer` FOREIGN KEY (`head_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT "Constraint fk_departments_head_officer already exists." AS status;'
);

PREPARE stmt FROM @sql_cmd;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 5. Table: complaints (4 of 16)
-- Civic issue reports registered by citizens and triaged by officers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `complaint_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `citizen_id` BIGINT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NULL,
  `assigned_officer_id` BIGINT UNSIGNED NULL,
  `status` ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `address` VARCHAR(500) NOT NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `rejection_reason` TEXT NULL,
  `resolution_notes` TEXT NULL,
  `resolved_at` TIMESTAMP NULL,
  `reported_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_complaints_code` (`complaint_code`),
  KEY `idx_complaints_citizen` (`citizen_id`),
  KEY `idx_complaints_category` (`category_id`),
  KEY `idx_complaints_department` (`department_id`),
  KEY `idx_complaints_officer` (`assigned_officer_id`),
  KEY `idx_complaints_status` (`status`),
  KEY `idx_complaints_priority` (`priority`),
  KEY `idx_complaints_reported_date` (`reported_date`),
  KEY `idx_complaints_status_date` (`status`, `reported_date`),
  KEY `idx_complaints_coords` (`latitude`, `longitude`),
  CONSTRAINT `fk_complaints_citizen`
    FOREIGN KEY (`citizen_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_officer`
    FOREIGN KEY (`assigned_officer_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: complaint_photos (5 of 16)
-- Uploaded evidence photos and resolution verification images.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_photos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `photo_url` VARCHAR(1000) NOT NULL,
  `photo_type` ENUM('INITIAL_EVIDENCE', 'RESOLUTION_EVIDENCE') NOT NULL DEFAULT 'INITIAL_EVIDENCE',
  `caption` VARCHAR(255) NULL,
  `uploaded_by_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_complaint_photos_complaint` (`complaint_id`),
  KEY `idx_complaint_photos_type` (`complaint_id`, `photo_type`),
  KEY `idx_complaint_photos_user` (`uploaded_by_id`),
  CONSTRAINT `fk_complaint_photos_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_photos_user`
    FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: complaint_status_history (6 of 16)
-- Chronological event history and timeline notes for complaints.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `performed_by_user_id` BIGINT UNSIGNED NULL,
  `performed_by_name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_csh_complaint` (`complaint_id`),
  KEY `idx_csh_created_at` (`created_at`),
  KEY `idx_csh_user` (`performed_by_user_id`),
  CONSTRAINT `fk_csh_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_csh_user`
    FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: work_orders (7 of 16)
-- Repair assignments issued by municipal officers to field crews.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `work_order_code` VARCHAR(50) NOT NULL,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  `supervisor_id` BIGINT UNSIGNED NULL,
  `supervisor_name` VARCHAR(255) NOT NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `work_description` TEXT NOT NULL,
  `assigned_crew` VARCHAR(255) NULL,
  `estimated_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `actual_cost` DECIMAL(12, 2) NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'REWORK_REQUIRED') NOT NULL DEFAULT 'PENDING',
  `issued_date` DATE NOT NULL,
  `deadline` DATE NOT NULL,
  `completed_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_work_orders_code` (`work_order_code`),
  KEY `idx_work_orders_complaint` (`complaint_id`),
  KEY `idx_work_orders_department` (`department_id`),
  KEY `idx_work_orders_status` (`status`),
  KEY `idx_work_orders_deadline` (`deadline`),
  KEY `idx_work_orders_supervisor` (`supervisor_id`),
  CONSTRAINT `fk_work_orders_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_work_orders_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_work_orders_supervisor`
    FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: repair_verifications (8 of 16)
-- Repair inspection outcomes submitted by supervisors and audited by officers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `repair_verifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `verification_code` VARCHAR(50) NOT NULL,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `work_order_id` BIGINT UNSIGNED NOT NULL,
  `submitted_by_supervisor_id` BIGINT UNSIGNED NULL,
  `supervisor_name` VARCHAR(255) NOT NULL,
  `completion_details` TEXT NOT NULL,
  `before_photo_url` VARCHAR(1000) NULL,
  `completion_photo_url` VARCHAR(1000) NOT NULL,
  `status` ENUM('AWAITING_VERIFICATION', 'VERIFIED_APPROVED', 'REWORK_REQUESTED') NOT NULL DEFAULT 'AWAITING_VERIFICATION',
  `verified_by_officer_id` BIGINT UNSIGNED NULL,
  `officer_remarks` TEXT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_repair_verifications_code` (`verification_code`),
  KEY `idx_rv_complaint` (`complaint_id`),
  KEY `idx_rv_work_order` (`work_order_id`),
  KEY `idx_rv_status` (`status`),
  KEY `idx_rv_officer` (`verified_by_officer_id`),
  CONSTRAINT `fk_rv_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rv_work_order`
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rv_supervisor`
    FOREIGN KEY (`submitted_by_supervisor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rv_officer`
    FOREIGN KEY (`verified_by_officer_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Table: feedback (9 of 16)
-- Citizen quality rating (1-5) and feedback comments for resolved complaints.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `citizen_id` BIGINT UNSIGNED NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback_complaint` (`complaint_id`),
  UNIQUE KEY `uq_feedback_citizen_complaint` (`citizen_id`, `complaint_id`),
  KEY `idx_feedback_rating` (`rating`),
  KEY `idx_feedback_citizen` (`citizen_id`),
  CONSTRAINT `chk_feedback_rating`
    CHECK (`rating` >= 1 AND `rating` <= 5),
  CONSTRAINT `fk_feedback_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedback_citizen`
    FOREIGN KEY (`citizen_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: inventory_items (10 of 16)
-- Municipal warehouse materials and equipment stock levels.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `department_id` INT UNSIGNED NULL,
  `description` TEXT NULL,
  `available_quantity` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL,
  `min_threshold` INT NOT NULL DEFAULT 10,
  `stock_status` ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
  `unit_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_items_code` (`item_code`),
  KEY `idx_inventory_category` (`category`),
  KEY `idx_inventory_status` (`stock_status`),
  KEY `idx_inventory_department` (`department_id`),
  CONSTRAINT `chk_inventory_qty`
    CHECK (`available_quantity` >= 0),
  CONSTRAINT `chk_inventory_min`
    CHECK (`min_threshold` >= 0),
  CONSTRAINT `fk_inventory_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Table: material_requests (11 of 16)
-- Material requisitions raised for active work orders.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `material_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_code` VARCHAR(50) NOT NULL,
  `work_order_id` BIGINT UNSIGNED NOT NULL,
  `complaint_id` BIGINT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  `requested_by_user_id` BIGINT UNSIGNED NULL,
  `requested_by_name` VARCHAR(255) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `reason` TEXT NOT NULL,
  `decision_notes` TEXT NULL,
  `decided_by_user_id` BIGINT UNSIGNED NULL,
  `request_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decided_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_requests_code` (`request_code`),
  KEY `idx_mr_work_order` (`work_order_id`),
  KEY `idx_mr_complaint` (`complaint_id`),
  KEY `idx_mr_status` (`status`),
  KEY `idx_mr_department` (`department_id`),
  KEY `idx_mr_requested_by` (`requested_by_user_id`),
  KEY `idx_mr_decided_by` (`decided_by_user_id`),
  CONSTRAINT `fk_mr_work_order`
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_requested_by`
    FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mr_decided_by`
    FOREIGN KEY (`decided_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Table: material_request_items (12 of 16)
-- Individual inventory line items and quantities tied to a material request.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `material_request_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_request_id` BIGINT UNSIGNED NOT NULL,
  `inventory_item_id` INT UNSIGNED NOT NULL,
  `requested_qty` INT UNSIGNED NOT NULL,
  `approved_qty` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mri_request_item` (`material_request_id`, `inventory_item_id`),
  KEY `idx_mri_item` (`inventory_item_id`),
  CONSTRAINT `chk_mri_requested_qty`
    CHECK (`requested_qty` > 0),
  CONSTRAINT `fk_mri_request`
    FOREIGN KEY (`material_request_id`) REFERENCES `material_requests` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mri_item`
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Table: inventory_transactions (13 of 16)
-- Audit log of stock additions, dispatches, adjustments, and returns.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inventory_item_id` INT UNSIGNED NOT NULL,
  `transaction_type` ENUM('STOCK_ADDITION', 'STOCK_DISPATCH', 'STOCK_ADJUSTMENT', 'STOCK_RETURN') NOT NULL,
  `quantity_change` INT NOT NULL,
  `balance_after` INT UNSIGNED NOT NULL,
  `material_request_id` BIGINT UNSIGNED NULL,
  `work_order_id` BIGINT UNSIGNED NULL,
  `reason` VARCHAR(255) NOT NULL,
  `performed_by_user_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_it_item` (`inventory_item_id`),
  KEY `idx_it_type` (`transaction_type`),
  KEY `idx_it_created` (`created_at`),
  KEY `idx_it_work_order` (`work_order_id`),
  KEY `idx_it_user` (`performed_by_user_id`),
  CONSTRAINT `fk_it_item`
    FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_it_material_request`
    FOREIGN KEY (`material_request_id`) REFERENCES `material_requests` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_it_work_order`
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_it_user`
    FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Table: notifications (14 of 16)
-- In-app notifications delivered to citizens and municipal officers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `notification_code` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `target_role` ENUM('CITIZEN', 'OFFICER', 'ADMIN', 'ALL') NOT NULL DEFAULT 'CITIZEN',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link_type` ENUM('COMPLAINT', 'WORK_ORDER', 'REPAIR_VERIFICATION', 'GENERAL') NOT NULL DEFAULT 'COMPLAINT',
  `link_id` VARCHAR(100) NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notifications_code` (`notification_code`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_role_read` (`target_role`, `is_read`),
  KEY `idx_notifications_created` (`created_at`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Table: duplicate_reviews (15 of 16)
-- Algorithmic duplicate candidate matches and triage review decisions.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `duplicate_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `review_code` VARCHAR(50) NOT NULL,
  `original_complaint_id` BIGINT UNSIGNED NOT NULL,
  `suspected_complaint_id` BIGINT UNSIGNED NOT NULL,
  `match_type` VARCHAR(150) NOT NULL,
  `similarity_score` TINYINT UNSIGNED NOT NULL,
  `review_status` ENUM('PENDING_REVIEW', 'CONFIRMED_DUPLICATE', 'DISMISSED') NOT NULL DEFAULT 'PENDING_REVIEW',
  `review_reason` TEXT NULL,
  `reviewed_by_user_id` BIGINT UNSIGNED NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_duplicate_reviews_code` (`review_code`),
  UNIQUE KEY `uq_duplicate_pair` (`original_complaint_id`, `suspected_complaint_id`),
  KEY `idx_dup_status` (`review_status`),
  KEY `idx_dup_suspected` (`suspected_complaint_id`),
  KEY `idx_dup_reviewer` (`reviewed_by_user_id`),
  CONSTRAINT `chk_dup_score`
    CHECK (`similarity_score` <= 100),
  CONSTRAINT `chk_dup_different`
    CHECK (`original_complaint_id` <> `suspected_complaint_id`),
  CONSTRAINT `fk_dup_original`
    FOREIGN KEY (`original_complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_dup_suspected`
    FOREIGN KEY (`suspected_complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_dup_reviewer`
    FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. Table: audit_logs (16 of 16)
-- System-wide audit trail recording user and officer actions.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `audit_code` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL,
  `actor_name` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` VARCHAR(100) NULL,
  `affected_record` VARCHAR(255) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_audit_logs_code` (`audit_code`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_audit_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET foreign_key_checks = 1;
