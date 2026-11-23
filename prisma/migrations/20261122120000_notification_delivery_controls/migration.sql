ALTER TABLE `notifications`
  ADD COLUMN `related_entity_type` VARCHAR(40) NULL,
  ADD COLUMN `related_entity_id` VARCHAR(100) NULL,
  ADD COLUMN `target_url` VARCHAR(500) NULL,
  ADD COLUMN `read_at` DATETIME(3) NULL,
  ADD INDEX `notifications_user_id_is_read_created_at_idx` (`user_id`, `is_read`, `created_at`);
