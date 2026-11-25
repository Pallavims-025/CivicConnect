ALTER TABLE `complaint_photos`
  MODIFY COLUMN `location_verification_status` ENUM(
    'VERIFIED',
    'REJECTED_LOCATION_MISMATCH',
    'GPS_METADATA_NOT_FOUND',
    'INVALID_GPS_METADATA',
    'COMPLAINT_LOCATION_NOT_AVAILABLE',
    'VERIFICATION_FAILED',
    'GPS_COORDINATES_NOT_FOUND'
  ) NOT NULL DEFAULT 'GPS_COORDINATES_NOT_FOUND',
  ADD COLUMN `location_extraction_method` VARCHAR(10) NULL;

UPDATE `complaint_photos`
SET `location_verification_status` = 'GPS_COORDINATES_NOT_FOUND',
    `location_extraction_method` = CASE
      WHEN `capture_latitude` IS NOT NULL AND `capture_longitude` IS NOT NULL THEN 'EXIF'
      ELSE 'NONE'
    END
WHERE `location_verification_status` = 'GPS_METADATA_NOT_FOUND';

UPDATE `complaint_photos`
SET `location_extraction_method` = CASE
  WHEN `capture_latitude` IS NOT NULL AND `capture_longitude` IS NOT NULL THEN 'EXIF'
  ELSE 'NONE'
END
WHERE `location_extraction_method` IS NULL;

ALTER TABLE `complaint_photos`
  MODIFY COLUMN `location_verification_status` ENUM(
    'VERIFIED',
    'REJECTED_LOCATION_MISMATCH',
    'GPS_COORDINATES_NOT_FOUND',
    'INVALID_GPS_METADATA',
    'COMPLAINT_LOCATION_NOT_AVAILABLE',
    'VERIFICATION_FAILED'
  ) NOT NULL DEFAULT 'GPS_COORDINATES_NOT_FOUND';
