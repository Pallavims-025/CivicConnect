ALTER TABLE `complaint_photos`
  ADD COLUMN `photo_source` ENUM('CAMERA', 'GALLERY') NOT NULL DEFAULT 'GALLERY',
  ADD COLUMN `capture_latitude` DOUBLE NULL,
  ADD COLUMN `capture_longitude` DOUBLE NULL,
  ADD COLUMN `captured_at` DATETIME(3) NULL,
  ADD COLUMN `location_verification_status` ENUM('MATCHED', 'MISMATCH', 'UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN `location_distance_metres` DOUBLE NULL,
  ADD COLUMN `location_review_decision` ENUM('ACKNOWLEDGED', 'FLAGGED') NULL,
  ADD COLUMN `location_reviewed_by_user_id` VARCHAR(36) NULL,
  ADD COLUMN `location_reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `location_review_notes` VARCHAR(1000) NULL,
  ADD INDEX `complaint_photos_location_verification_status_idx` (`location_verification_status`),
  ADD INDEX `complaint_photos_location_reviewed_by_user_id_idx` (`location_reviewed_by_user_id`),
  ADD CONSTRAINT `complaint_photos_location_reviewed_by_user_id_fkey`
    FOREIGN KEY (`location_reviewed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
