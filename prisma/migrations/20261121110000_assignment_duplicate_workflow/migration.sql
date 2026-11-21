ALTER TABLE `work_orders`
  MODIFY `status` ENUM('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'OVERDUE', 'REWORK_REQUIRED') NOT NULL DEFAULT 'PENDING',
  MODIFY `after_photo_url` MEDIUMTEXT NULL,
  ADD COLUMN `assigned_by_officer_id` VARCHAR(36) NULL,
  ADD COLUMN `assigned_at` DATETIME(3) NULL,
  ADD COLUMN `accepted_at` DATETIME(3) NULL,
  ADD INDEX `work_orders_assigned_by_officer_id_idx` (`assigned_by_officer_id`),
  ADD CONSTRAINT `work_orders_assigned_by_officer_id_fkey` FOREIGN KEY (`assigned_by_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `complaints`
  ADD COLUMN `duplicate_of_id` VARCHAR(36) NULL,
  ADD COLUMN `duplicate_classification` ENUM('NEW', 'POSSIBLE_DUPLICATE', 'LIKELY_DUPLICATE') NOT NULL DEFAULT 'NEW',
  ADD COLUMN `duplicate_review_status` ENUM('NOT_REQUIRED', 'PENDING_REVIEW', 'LINKED_TO_EXISTING', 'MARKED_SEPARATE') NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD INDEX `complaints_duplicate_of_id_idx` (`duplicate_of_id`),
  ADD INDEX `complaints_duplicate_review_status_duplicate_classification_idx` (`duplicate_review_status`, `duplicate_classification`),
  ADD CONSTRAINT `complaints_duplicate_of_id_fkey` FOREIGN KEY (`duplicate_of_id`) REFERENCES `complaints` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `complaint_photos`
  MODIFY `image_url` MEDIUMTEXT NOT NULL,
  ADD COLUMN `perceptual_hash` CHAR(16) NULL;

ALTER TABLE `repair_verifications`
  MODIFY `before_photo_url` MEDIUMTEXT NULL,
  MODIFY `completion_photo_url` MEDIUMTEXT NOT NULL;

CREATE TABLE `work_order_status_history` (
  `id` VARCHAR(36) NOT NULL,
  `work_order_id` VARCHAR(36) NOT NULL,
  `previous_status` ENUM('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'OVERDUE', 'REWORK_REQUIRED') NULL,
  `new_status` ENUM('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'COMPLETED', 'OVERDUE', 'REWORK_REQUIRED') NOT NULL,
  `notes` TEXT NULL,
  `changed_by_user_id` VARCHAR(36) NULL,
  `changed_by_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `work_order_status_history_work_order_id_created_at_idx` (`work_order_id`, `created_at`),
  INDEX `work_order_status_history_changed_by_user_id_idx` (`changed_by_user_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `work_order_status_history_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `work_order_status_history_changed_by_user_id_fkey` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `work_order_photos` (
  `id` VARCHAR(36) NOT NULL,
  `work_order_id` VARCHAR(36) NOT NULL,
  `uploaded_by_user_id` VARCHAR(36) NULL,
  `image_url` MEDIUMTEXT NOT NULL,
  `photo_type` ENUM('COMPLETION') NOT NULL DEFAULT 'COMPLETION',
  `caption` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `work_order_photos_work_order_id_photo_type_idx` (`work_order_id`, `photo_type`),
  INDEX `work_order_photos_uploaded_by_user_id_idx` (`uploaded_by_user_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `work_order_photos_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `work_order_photos_uploaded_by_user_id_fkey` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `duplicate_complaint_matches` (
  `id` VARCHAR(36) NOT NULL,
  `complaint_id` VARCHAR(36) NOT NULL,
  `matched_complaint_id` VARCHAR(36) NOT NULL,
  `similarity_score` DOUBLE NOT NULL,
  `classification` ENUM('NEW', 'POSSIBLE_DUPLICATE', 'LIKELY_DUPLICATE') NOT NULL,
  `comparison` JSON NOT NULL,
  `decision` ENUM('PENDING', 'LINKED', 'SEPARATE', 'KEEP_REVIEWING') NOT NULL DEFAULT 'PENDING',
  `reviewed_by_user_id` VARCHAR(36) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `duplicate_matches_source_target_key` (`complaint_id`, `matched_complaint_id`),
  INDEX `duplicate_complaint_matches_complaint_id_decision_idx` (`complaint_id`, `decision`),
  INDEX `duplicate_complaint_matches_matched_complaint_id_idx` (`matched_complaint_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `duplicate_complaint_matches_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `duplicate_complaint_matches_matched_complaint_id_fkey` FOREIGN KEY (`matched_complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `duplicate_complaint_matches_reviewed_by_user_id_fkey` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
