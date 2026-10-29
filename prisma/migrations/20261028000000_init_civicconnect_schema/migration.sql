-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `contact_email` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    UNIQUE INDEX `departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('CITIZEN', 'OFFICER', 'SUPERVISOR', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
    `phone` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(1000) NULL,
    `ward` VARCHAR(100) NULL,
    `address` VARCHAR(500) NULL,
    `title` VARCHAR(150) NULL,
    `department_id` INTEGER NULL,
    `ward_coverage` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_department_id_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `color` VARCHAR(50) NULL,
    `department_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `categories_name_key`(`name`),
    INDEX `categories_department_id_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(36) NOT NULL,
    `complaint_code` VARCHAR(50) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `address` VARCHAR(500) NULL,
    `rejection_reason` TEXT NULL,
    `resolution_notes` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `department_id` INTEGER NULL,
    `assigned_officer_id` VARCHAR(36) NULL,

    UNIQUE INDEX `complaints_complaint_code_key`(`complaint_code`),
    INDEX `complaints_user_id_idx`(`user_id`),
    INDEX `complaints_category_id_idx`(`category_id`),
    INDEX `complaints_department_id_idx`(`department_id`),
    INDEX `complaints_assigned_officer_id_idx`(`assigned_officer_id`),
    INDEX `complaints_status_idx`(`status`),
    INDEX `complaints_priority_idx`(`priority`),
    INDEX `complaints_created_at_idx`(`created_at`),
    INDEX `complaints_status_created_at_idx`(`status`, `created_at`),
    INDEX `complaints_category_id_status_idx`(`category_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_photos` (
    `id` VARCHAR(36) NOT NULL,
    `image_url` VARCHAR(1000) NOT NULL,
    `photo_type` ENUM('INITIAL_EVIDENCE', 'RESOLUTION_EVIDENCE') NOT NULL DEFAULT 'INITIAL_EVIDENCE',
    `caption` VARCHAR(255) NULL,
    `uploaded_by_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `complaint_id` VARCHAR(36) NOT NULL,

    INDEX `complaint_photos_complaint_id_idx`(`complaint_id`),
    INDEX `complaint_photos_complaint_id_photo_type_idx`(`complaint_id`, `photo_type`),
    INDEX `complaint_photos_uploaded_by_id_idx`(`uploaded_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_orders` (
    `id` VARCHAR(36) NOT NULL,
    `work_order_code` VARCHAR(50) NULL,
    `complaint_id` VARCHAR(36) NOT NULL,
    `department_id` INTEGER NOT NULL,
    `supervisor_id` VARCHAR(36) NULL,
    `supervisor_name` VARCHAR(255) NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'OVERDUE', 'REWORK_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `work_description` TEXT NOT NULL,
    `assigned_crew` VARCHAR(255) NULL,
    `estimated_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `actual_cost` DECIMAL(12, 2) NULL,
    `before_photo_url` VARCHAR(1000) NULL,
    `after_photo_url` VARCHAR(1000) NULL,
    `issued_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NOT NULL,
    `completed_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_orders_work_order_code_key`(`work_order_code`),
    INDEX `work_orders_complaint_id_idx`(`complaint_id`),
    INDEX `work_orders_department_id_idx`(`department_id`),
    INDEX `work_orders_supervisor_id_idx`(`supervisor_id`),
    INDEX `work_orders_status_idx`(`status`),
    INDEX `work_orders_deadline_idx`(`deadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_items` (
    `id` VARCHAR(36) NOT NULL,
    `item_code` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `available_quantity` INTEGER NOT NULL DEFAULT 0,
    `min_threshold` INTEGER NOT NULL DEFAULT 10,
    `unit_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `stock_status` ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
    `department_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_items_item_code_key`(`item_code`),
    INDEX `inventory_items_category_idx`(`category`),
    INDEX `inventory_items_stock_status_idx`(`stock_status`),
    INDEX `inventory_items_department_id_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_requests` (
    `id` VARCHAR(36) NOT NULL,
    `request_code` VARCHAR(50) NULL,
    `work_order_id` VARCHAR(36) NOT NULL,
    `requested_by_user_id` VARCHAR(36) NULL,
    `requested_by_name` VARCHAR(255) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reason` TEXT NOT NULL,
    `decision_notes` TEXT NULL,
    `decided_by_user_id` VARCHAR(36) NULL,
    `request_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decided_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_requests_request_code_key`(`request_code`),
    INDEX `material_requests_work_order_id_idx`(`work_order_id`),
    INDEX `material_requests_status_idx`(`status`),
    INDEX `material_requests_requested_by_user_id_idx`(`requested_by_user_id`),
    INDEX `material_requests_decided_by_user_id_idx`(`decided_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_request_items` (
    `id` VARCHAR(36) NOT NULL,
    `material_request_id` VARCHAR(36) NOT NULL,
    `inventory_item_id` VARCHAR(36) NOT NULL,
    `requested_qty` INTEGER NOT NULL,
    `approved_qty` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `material_request_items_inventory_item_id_idx`(`inventory_item_id`),
    UNIQUE INDEX `material_request_items_material_request_id_inventory_item_id_key`(`material_request_id`, `inventory_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `inventory_item_id` VARCHAR(36) NOT NULL,
    `transaction_type` ENUM('STOCK_ADDITION', 'STOCK_DISPATCH', 'STOCK_ADJUSTMENT', 'STOCK_RETURN') NOT NULL,
    `quantity_change` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `material_request_id` VARCHAR(36) NULL,
    `work_order_id` VARCHAR(36) NULL,
    `reason` VARCHAR(255) NOT NULL,
    `performed_by_user_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_transactions_inventory_item_id_idx`(`inventory_item_id`),
    INDEX `inventory_transactions_transaction_type_idx`(`transaction_type`),
    INDEX `inventory_transactions_work_order_id_idx`(`work_order_id`),
    INDEX `inventory_transactions_performed_by_user_id_idx`(`performed_by_user_id`),
    INDEX `inventory_transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repair_verifications` (
    `id` VARCHAR(36) NOT NULL,
    `verification_code` VARCHAR(50) NULL,
    `complaint_id` VARCHAR(36) NOT NULL,
    `work_order_id` VARCHAR(36) NOT NULL,
    `submitted_by_supervisor_id` VARCHAR(36) NULL,
    `supervisor_name` VARCHAR(255) NOT NULL,
    `completion_details` TEXT NOT NULL,
    `before_photo_url` VARCHAR(1000) NULL,
    `completion_photo_url` VARCHAR(1000) NOT NULL,
    `status` ENUM('AWAITING_VERIFICATION', 'VERIFIED_APPROVED', 'REWORK_REQUESTED') NOT NULL DEFAULT 'AWAITING_VERIFICATION',
    `verified_by_officer_id` VARCHAR(36) NULL,
    `officer_remarks` TEXT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `repair_verifications_verification_code_key`(`verification_code`),
    INDEX `repair_verifications_complaint_id_idx`(`complaint_id`),
    INDEX `repair_verifications_work_order_id_idx`(`work_order_id`),
    INDEX `repair_verifications_status_idx`(`status`),
    INDEX `repair_verifications_submitted_by_supervisor_id_idx`(`submitted_by_supervisor_id`),
    INDEX `repair_verifications_verified_by_officer_id_idx`(`verified_by_officer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_status_history` (
    `id` VARCHAR(36) NOT NULL,
    `complaint_id` VARCHAR(36) NOT NULL,
    `previous_status` ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NULL,
    `new_status` ENUM('PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `performed_by_user_id` VARCHAR(36) NULL,
    `performed_by_name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaint_status_history_complaint_id_idx`(`complaint_id`),
    INDEX `complaint_status_history_performed_by_user_id_idx`(`performed_by_user_id`),
    INDEX `complaint_status_history_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `notification_code` VARCHAR(50) NULL,
    `user_id` VARCHAR(36) NULL,
    `target_role` VARCHAR(50) NOT NULL DEFAULT 'ALL',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `notification_type` ENUM('COMPLAINT', 'WORK_ORDER', 'REPAIR_VERIFICATION', 'SYSTEM', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `complaint_id` VARCHAR(36) NULL,
    `work_order_id` VARCHAR(36) NULL,
    `link_id` VARCHAR(100) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notifications_notification_code_key`(`notification_code`),
    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_target_role_is_read_idx`(`target_role`, `is_read`),
    INDEX `notifications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `audit_code` VARCHAR(50) NULL,
    `user_id` VARCHAR(36) NULL,
    `actor_name` VARCHAR(255) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` VARCHAR(100) NULL,
    `affected_record` VARCHAR(255) NOT NULL,
    `details` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `audit_logs_audit_code_key`(`audit_code`),
    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `id` VARCHAR(36) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` VARCHAR(36) NOT NULL,
    `complaint_id` VARCHAR(36) NOT NULL,

    INDEX `feedback_complaint_id_idx`(`complaint_id`),
    INDEX `feedback_user_id_idx`(`user_id`),
    UNIQUE INDEX `feedback_user_id_complaint_id_key`(`user_id`, `complaint_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_assigned_officer_id_fkey` FOREIGN KEY (`assigned_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_photos` ADD CONSTRAINT `complaint_photos_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_photos` ADD CONSTRAINT `complaint_photos_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_requested_by_user_id_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_requests` ADD CONSTRAINT `material_requests_decided_by_user_id_fkey` FOREIGN KEY (`decided_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_items` ADD CONSTRAINT `material_request_items_material_request_id_fkey` FOREIGN KEY (`material_request_id`) REFERENCES `material_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_request_items` ADD CONSTRAINT `material_request_items_inventory_item_id_fkey` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_inventory_item_id_fkey` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_material_request_id_fkey` FOREIGN KEY (`material_request_id`) REFERENCES `material_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_performed_by_user_id_fkey` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_verifications` ADD CONSTRAINT `repair_verifications_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_verifications` ADD CONSTRAINT `repair_verifications_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_verifications` ADD CONSTRAINT `repair_verifications_submitted_by_supervisor_id_fkey` FOREIGN KEY (`submitted_by_supervisor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repair_verifications` ADD CONSTRAINT `repair_verifications_verified_by_officer_id_fkey` FOREIGN KEY (`verified_by_officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_status_history` ADD CONSTRAINT `complaint_status_history_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_status_history` ADD CONSTRAINT `complaint_status_history_performed_by_user_id_fkey` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
