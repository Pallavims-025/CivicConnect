ALTER TABLE `complaint_photos`
  MODIFY COLUMN `location_verification_status` ENUM(
    'MATCHED',
    'MISMATCH',
    'UNVERIFIED',
    'VERIFIED',
    'LOCATION_MISMATCH',
    'GPS_METADATA_NOT_FOUND',
    'INVALID_GPS_METADATA',
    'COMPARISON_UNAVAILABLE',
    'VERIFICATION_FAILED'
  ) NOT NULL DEFAULT 'GPS_METADATA_NOT_FOUND',
  ADD COLUMN `location_verified_at` DATETIME(3) NULL;

UPDATE `complaint_photos`
SET `location_verification_status` = CASE
  WHEN `location_verification_status` = 'MATCHED' THEN 'VERIFIED'
  WHEN `location_verification_status` = 'MISMATCH' THEN 'LOCATION_MISMATCH'
  ELSE 'GPS_METADATA_NOT_FOUND'
END;

ALTER TABLE `complaint_photos`
  MODIFY COLUMN `location_verification_status` ENUM(
    'VERIFIED',
    'LOCATION_MISMATCH',
    'GPS_METADATA_NOT_FOUND',
    'INVALID_GPS_METADATA',
    'COMPARISON_UNAVAILABLE',
    'VERIFICATION_FAILED',
    'UNVERIFIED'
  ) NOT NULL DEFAULT 'GPS_METADATA_NOT_FOUND';
