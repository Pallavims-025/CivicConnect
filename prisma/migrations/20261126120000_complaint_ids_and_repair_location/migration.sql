-- Allocate short sequential complaint references without changing UUID primary keys.
CREATE TABLE `complaint_code_sequence` (
  `id` TINYINT NOT NULL,
  `next_value` BIGINT NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `complaint_code_sequence` (`id`, `next_value`) VALUES (1, 1000);

-- Backfill legacy complaints deterministically, retaining all existing records.
SET @complaint_number := GREATEST(
  1000,
  COALESCE((SELECT MAX(CAST(SUBSTRING(`complaint_code`, 4) AS UNSIGNED)) FROM `complaints` WHERE `complaint_code` REGEXP '^CC-[0-9]+$'), 1000)
);
UPDATE `complaints`
SET `complaint_code` = CONCAT('CC-', (@complaint_number := @complaint_number + 1))
WHERE `complaint_code` IS NULL
ORDER BY `created_at`, `id`;

UPDATE `complaint_code_sequence`
SET `next_value` = GREATEST(
  @complaint_number,
  COALESCE((SELECT MAX(CAST(SUBSTRING(`complaint_code`, 4) AS UNSIGNED)) FROM `complaints` WHERE `complaint_code` REGEXP '^CC-[0-9]+$'), 1000)
)
WHERE `id` = 1;

ALTER TABLE `repair_verifications`
  ADD COLUMN `capture_latitude` DOUBLE NULL,
  ADD COLUMN `capture_longitude` DOUBLE NULL,
  ADD COLUMN `location_extraction_method` VARCHAR(10) NULL,
  ADD COLUMN `location_verification_status` ENUM('VERIFIED', 'REJECTED_LOCATION_MISMATCH', 'GPS_COORDINATES_NOT_FOUND', 'INVALID_GPS_METADATA', 'COMPLAINT_LOCATION_NOT_AVAILABLE', 'VERIFICATION_FAILED') NOT NULL DEFAULT 'GPS_COORDINATES_NOT_FOUND',
  ADD COLUMN `location_distance_metres` DOUBLE NULL,
  ADD COLUMN `location_verified_at` DATETIME(3) NULL,
  ADD INDEX `repair_verifications_location_verification_status_idx` (`location_verification_status`);

ALTER TABLE `work_order_photos`
  ADD COLUMN `capture_latitude` DOUBLE NULL,
  ADD COLUMN `capture_longitude` DOUBLE NULL,
  ADD COLUMN `location_extraction_method` VARCHAR(10) NULL,
  ADD COLUMN `location_verification_status` ENUM('VERIFIED', 'REJECTED_LOCATION_MISMATCH', 'GPS_COORDINATES_NOT_FOUND', 'INVALID_GPS_METADATA', 'COMPLAINT_LOCATION_NOT_AVAILABLE', 'VERIFICATION_FAILED') NOT NULL DEFAULT 'GPS_COORDINATES_NOT_FOUND',
  ADD COLUMN `location_distance_metres` DOUBLE NULL,
  ADD COLUMN `location_verified_at` DATETIME(3) NULL,
  ADD INDEX `work_order_photos_location_verification_status_idx` (`location_verification_status`);
