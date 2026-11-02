-- =============================================================================
-- CivicConnect: Civic Issue Reporting & Municipal Accountability Platform
-- Initial Reference & Demonstration Seed Data for MySQL 8.x
-- File: database/seed.sql
-- =============================================================================

USE `civicconnect`;

-- =============================================================================
-- SAFE SEEDING POLICY:
-- By default, this script does NOT drop, truncate, or wipe existing data.
-- It utilizes idempotent INSERT IGNORE INTO statements so running this script
-- safely populates missing reference data without corrupting active records.
--
-- If an explicit clean slate is required during local development, uncomment
-- and execute the following TRUNCATE block deliberately:
--
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE `audit_logs`;
-- TRUNCATE TABLE `duplicate_reviews`;
-- TRUNCATE TABLE `notifications`;
-- TRUNCATE TABLE `inventory_transactions`;
-- TRUNCATE TABLE `material_request_items`;
-- TRUNCATE TABLE `material_requests`;
-- TRUNCATE TABLE `inventory_items`;
-- TRUNCATE TABLE `feedback`;
-- TRUNCATE TABLE `repair_verifications`;
-- TRUNCATE TABLE `work_orders`;
-- TRUNCATE TABLE `complaint_status_history`;
-- TRUNCATE TABLE `complaint_photos`;
-- TRUNCATE TABLE `complaints`;
-- TRUNCATE TABLE `users`;
-- TRUNCATE TABLE `categories`;
-- TRUNCATE TABLE `departments`;
-- SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Seed Municipal Departments
-- Reference: Core municipal wings handling public infrastructure and civic issues.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `departments` (`id`, `code`, `name`, `description`, `contact_email`, `contact_phone`, `is_active`)
VALUES
  (1, 'ROAD',   'Roads & Bridges Dept',        'Maintenance of city roads, flyovers, potholes, and bridges',       'roads.helpdesk@civicconnect.local',       '+91-80-2222-1001', TRUE),
  (2, 'SWM',    'Solid Waste Management',      'Garbage collection, waste processing, and community bins',         'waste.mgmt@civicconnect.local',           '+91-80-2222-1002', TRUE),
  (3, 'ELEC',   'Electrical & Lighting',       'Streetlights, public fixture illumination, and electrical poles',   'electrical.grid@civicconnect.local',      '+91-80-2222-1003', TRUE),
  (4, 'WATER',  'Water Supply & Sewerage',     'Potable water pipelines, distribution, and valve maintenance',     'water.board@civicconnect.local',          '+91-80-2222-1004', TRUE),
  (5, 'SWD',    'Stormwater Drains (SWD)',     'Culverts, monsoon drains, storm drains, and desilting',            'stormwater.drains@civicconnect.local',    '+91-80-2222-1005', TRUE),
  (6, 'HORT',   'Horticulture & Parks',        'Public parks, trees, landscaping, and civic green spaces',         'parks.horticulture@civicconnect.local',   '+91-80-2222-1006', TRUE),
  (7, 'HEALTH', 'Health & Public Sanitation',  'Public hygiene, pest control, and general civic sanitation',       'health.sanitation@civicconnect.local',    '+91-80-2222-1007', TRUE);

-- -----------------------------------------------------------------------------
-- 2. Seed Complaint Categories
-- Reference: Matches INITIAL_CATEGORIES from src/data/mockData.js
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `categories` (`id`, `name`, `description`, `icon`, `color`, `department_id`, `is_active`)
VALUES
  (1, 'Roads & Potholes',      'Surface damage, potholes, and broken asphalt',                    'Construction', 'orange', 1, TRUE),
  (2, 'Garbage & Waste',       'Uncollected refuse, overflowing bins, and illegal dumps',         'Trash2',       'red',    2, TRUE),
  (3, 'Broken Streetlights',   'Flickering, damaged, or unlit street fixtures',                   'Lightbulb',    'amber',  3, TRUE),
  (4, 'Water Leakage',         'Burst pipelines, leaking public taps, water wastage',              'Droplets',     'blue',   4, TRUE),
  (5, 'Drainage & Sewage',     'Clogged drains, sewage overflow, broken manhole covers',          'Waves',        'purple', 5, TRUE),
  (6, 'Public Infrastructure', 'Damaged sidewalks, bus shelters, public park benches',             'Landmark',     'indigo', 6, TRUE),
  (7, 'Other Civic Issues',    'General municipal concerns not listed above',                     'AlertCircle',  'slate',  7, TRUE);

-- -----------------------------------------------------------------------------
-- 3. Seed Reference Users (Demonstration Profiles)
-- Note: password_hash is set to NULL. No real credentials or working accounts.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `users` (
  `id`, `user_code`, `role`, `name`, `email`, `phone`, `password_hash`,
  `avatar_url`, `ward`, `address`, `title`, `department_id`, `ward_coverage`, `is_active`, `joined_date`
)
VALUES
  -- Citizen 1: Priya Sharma (matches INITIAL_CITIZEN)
  (1, 'usr-cit-01', 'CITIZEN', 'Priya Sharma', 'priya.sharma@civicmail.in', '+91 98765 43210',
   NULL,
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
   'Ward 14 - Indiranagar', '42, 12th Main Road, HAL 2nd Stage, Indiranagar', NULL, NULL, NULL, TRUE, '2026-01-15'),

  -- Citizen 2: Anand Varma (matches mock data report)
  (2, 'usr-cit-02', 'CITIZEN', 'Anand Varma', 'anand.varma@civicmail.in', '+91 98450 77889',
   NULL,
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
   'Ward 15 - Domlur', 'Opposite Community Hall, 100 Feet Road, HAL 2nd Stage', NULL, NULL, NULL, TRUE, '2026-02-01'),

  -- Citizen 3: Deepa Nair (matches mock data report)
  (3, 'usr-cit-03', 'CITIZEN', 'Deepa Nair', 'deepa.nair@civicmail.in', '+91 97401 22334',
   NULL,
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
   'Ward 14 - Indiranagar', '3rd Cross, Binnamangala, Indiranagar', NULL, NULL, NULL, TRUE, '2026-02-10'),

  -- Officer: Er. Rajesh Kumar (matches INITIAL_OFFICER)
  (4, 'usr-off-01', 'OFFICER', 'Er. Rajesh Kumar', 'rajesh.kumar@municipality.gov.in', '+91 94480 11223',
   NULL,
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
   NULL, NULL, 'Executive Municipal Engineer', 1, 'Central Zone (Wards 12 to 18)', TRUE, '2025-06-01'),

  -- Administrator: Municipal Admin (System overseer)
  (5, 'usr-adm-01', 'ADMIN', 'Municipal Administrator', 'admin@municipality.gov.in', '+91 94480 00001',
   NULL,
   'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
   NULL, NULL, 'Chief Municipal Systems Officer', NULL, 'All Municipal Zones', TRUE, '2025-01-01');

-- Assign head officer to Roads & Bridges Dept
UPDATE `departments` SET `head_officer_id` = 4 WHERE `id` = 1 AND `head_officer_id` IS NULL;

-- -----------------------------------------------------------------------------
-- 4. Seed Inventory Items
-- Reference: Matches INITIAL_INVENTORY with reconciled transaction ledger math:
-- Starting stock: 120 bags of INV-01. Dispatched: 12 bags for WO-2026-088.
-- Final available_quantity = 108 bags (120 - 12 = 108).
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `inventory_items` (
  `id`, `item_code`, `name`, `category`, `department_id`, `description`,
  `available_quantity`, `unit`, `min_threshold`, `stock_status`, `unit_cost`
)
VALUES
  (1, 'INV-01', 'Cold-Mix Asphalt Bags (50kg)',             'Road Repair', 1, 'Instant ready-to-use pothole patching compound for all weather.',               108, 'Bags',  40, 'IN_STOCK',     450.00),
  (2, 'INV-02', 'LED Streetlight Fixture 65W',               'Electrical',  3, 'Outdoor waterproof IP66 energy-efficient LED luminaire.',                      14,  'Units', 25, 'LOW_STOCK',   2100.00),
  (3, 'INV-03', 'PVC Drainage Pipe (160mm x 6m)',            'Drainage',    5, 'Heavy duty unplasticized PVC pipes for municipal stormwater culverts.',        38,  'Pipes', 20, 'IN_STOCK',    1850.00),
  (4, 'INV-04', 'Cast Iron Manhole Covers (Heavy 600mm)',    'Sanitation',  2, 'Traffic-grade circular ductile iron covers with anti-theft locking hinge.',     3,   'Units', 10, 'LOW_STOCK',   4800.00),
  (5, 'INV-05', 'Disinfectant Bleaching Powder (25kg)',      'Sanitation',  2, 'Municipal grade chlorine bleaching compound for post-waste cleanup.',          85,  'Sacks', 30, 'IN_STOCK',     620.00),
  (6, 'INV-06', 'Ductile Iron Pipe Couplers 110mm',          'Water Works', 4, 'Mechanical repair sleeve clamps for high-pressure water mains.',               0,   'Sets',   8, 'OUT_OF_STOCK', 1350.00);

-- -----------------------------------------------------------------------------
-- 5. Seed Demonstration Complaints
-- Reference: Matches core complaints from src/data/mockData.js
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `complaints` (
  `id`, `complaint_code`, `title`, `description`, `citizen_id`, `category_id`,
  `department_id`, `assigned_officer_id`, `status`, `priority`, `address`,
  `latitude`, `longitude`, `rejection_reason`, `resolution_notes`, `resolved_at`,
  `reported_date`, `last_updated`
)
VALUES
  -- Complaint 1: In Progress with Work Order & Material Request
  (1, 'CC-2026-1041',
   'Severe pothole cluster near Metro Pillar 142',
   'A cluster of three deep potholes measuring over 1 foot wide on the main carriageway. Multiple two-wheelers have lost balance during morning rain.',
   1, 1, 1, 4, 'IN_PROGRESS', 'HIGH',
   'Near Metro Pillar 142, CMH Road, Indiranagar',
   12.97840000, 77.64080000, NULL, NULL, NULL,
   '2026-10-10 09:30:00', '2026-10-13 14:15:00'),

  -- Complaint 2: Resolved with Feedback & Verification Evidence
  (2, 'CC-2026-1038',
   'Open overflowing garbage dump on 80 Feet Road corner',
   'Community garbage containers have not been cleared for 4 days. Waste is spilling onto the pedestrian sidewalk creating foul smell and stray animal hazard.',
   1, 2, 2, 4, 'RESOLVED', 'MEDIUM',
   'Corner of 80 Feet Road & 4th Cross, Indiranagar',
   12.97190000, 77.64120000, NULL, 'Site cleared, 3 metric tons removed and lime powder applied.', '2026-10-09 16:45:00',
   '2026-10-06 11:20:00', '2026-10-09 16:45:00'),

  -- Complaint 3: Newly submitted pending triage
  (3, 'CC-2026-1044',
   'Dark zone: 4 consecutive streetlights not functioning',
   'Streetlights #SL-14 to #SL-17 along 6th Main have been completely dark for a week. Pedestrians feel unsafe walking back from bus stop after 7 PM.',
   1, 3, 3, NULL, 'PENDING', 'MEDIUM',
   '6th Main Road, Defense Colony, Indiranagar',
   12.97500000, 77.64350000, NULL, NULL, NULL,
   '2026-10-14 18:40:00', '2026-10-14 18:40:00'),

  -- Complaint 4: Suspected Duplicate of Complaint 1
  (4, 'CC-2026-1045',
   'Big crater in road opposite Metro 142',
   'Deep road crater right in front of metro pillar 142 creating dangerous bottleneck.',
   2, 1, 1, NULL, 'PENDING', 'HIGH',
   'Opp Metro Pillar 142, Indiranagar',
   12.97850000, 77.64090000, NULL, NULL, NULL,
   '2026-10-11 16:45:00', '2026-10-11 16:45:00');

-- -----------------------------------------------------------------------------
-- 6. Seed Complaint Photos
-- Evidence and resolution photographs.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `complaint_photos` (`id`, `complaint_id`, `photo_url`, `photo_type`, `caption`, `uploaded_by_id`, `created_at`)
VALUES
  (1, 1, 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80', 'INITIAL_EVIDENCE', 'Pothole damage near metro pillar', 1, '2026-10-10 09:30:00'),
  (2, 2, 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80', 'INITIAL_EVIDENCE', 'Overflowing garbage bin corner', 1, '2026-10-06 11:20:00'),
  (3, 2, 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80', 'RESOLUTION_EVIDENCE', 'Post-cleanup site sanitized', 4, '2026-10-09 16:45:00'),
  (4, 3, 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80', 'INITIAL_EVIDENCE', 'Dark street stretch along 6th Main', 1, '2026-10-14 18:40:00'),
  (5, 4, 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80', 'INITIAL_EVIDENCE', 'Road crater photo from second citizen', 2, '2026-10-11 16:45:00');

-- -----------------------------------------------------------------------------
-- 7. Seed Complaint Status History
-- Chronological audit timeline matching UI timeline cards.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `complaint_status_history` (`id`, `complaint_id`, `status`, `title`, `description`, `performed_by_user_id`, `performed_by_name`, `created_at`)
VALUES
  -- Complaint 1 timeline
  (1, 1, 'PENDING',      'Complaint Registered',      'Citizen submitted report with 1 geotagged photo.', 1, 'Priya Sharma',    '2026-10-10 09:30:00'),
  (2, 1, 'UNDER_REVIEW', 'Under Review',              'Officer reviewed issue and classified as HIGH priority.', 4, 'Er. Rajesh Kumar', '2026-10-11 11:00:00'),
  (3, 1, 'IN_PROGRESS',  'Work Order Issued',         'Work Order #WO-2026-088 assigned to Asphalt Crew B.', 4, 'Er. Rajesh Kumar', '2026-10-12 10:20:00'),
  (4, 1, 'IN_PROGRESS',  'Repair In Progress',        'Material dispatched from Central Yard. Surface grading underway.', NULL, 'Supervisor M. Rao', '2026-10-13 14:15:00'),

  -- Complaint 2 timeline
  (5, 2, 'PENDING',      'Complaint Submitted',       'Complaint filed with photo evidence.', 1, 'Priya Sharma',    '2026-10-06 11:20:00'),
  (6, 2, 'UNDER_REVIEW', 'Inspection & Crew Dispatched', 'Sanitation Compactor 7 assigned.', NULL, 'Inspector S. Patil', '2026-10-07 09:15:00'),
  (7, 2, 'IN_PROGRESS',  'Site Cleaned & Disinfected', '3 metric tons removed and lime powder sprayed.', NULL, 'Supervisor K. Das', '2026-10-08 17:00:00'),
  (8, 2, 'RESOLVED',     'Verification Approved',     'Municipal officer verified post-cleanup site photos.', 4, 'Er. Rajesh Kumar', '2026-10-09 16:45:00'),

  -- Complaint 3 timeline
  (9, 3, 'PENDING',      'Complaint Registered',      'New civic report submitted via Citizen portal.', 1, 'Priya Sharma',    '2026-10-14 18:40:00');

-- -----------------------------------------------------------------------------
-- 8. Seed Work Orders
-- Field repair assignments matching INITIAL_WORK_ORDERS.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `work_orders` (
  `id`, `work_order_code`, `complaint_id`, `department_id`, `supervisor_id`,
  `supervisor_name`, `priority`, `work_description`, `assigned_crew`,
  `estimated_cost`, `actual_cost`, `status`, `issued_date`, `deadline`, `completed_date`
)
VALUES
  (1, 'WO-2026-088', 1, 1, NULL, 'Supervisor M. Rao', 'HIGH',
   'Cold-mix asphalt patching and compaction of 3 potholes on CMH Road main corridor.',
   'Asphalt Rapid Repair Team B (5 workers)', 18500.00, NULL, 'IN_PROGRESS', '2026-10-12', '2026-10-16', NULL),

  (2, 'WO-2026-081', 2, 2, NULL, 'Supervisor K. Das', 'MEDIUM',
   'Clear 3MT debris, deploy secondary collection bin, and apply disinfectant spray.',
   'Sanitation Compactor Crew 7', 6200.00, 5900.00, 'COMPLETED', '2026-10-07', '2026-10-08', '2026-10-08');

-- -----------------------------------------------------------------------------
-- 9. Seed Repair Verifications
-- Field repair quality checks matching INITIAL_REPAIR_VERIFICATIONS.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `repair_verifications` (
  `id`, `verification_code`, `complaint_id`, `work_order_id`,
  `submitted_by_supervisor_id`, `supervisor_name`, `completion_details`,
  `before_photo_url`, `completion_photo_url`, `status`,
  `verified_by_officer_id`, `officer_remarks`, `submitted_at`, `verified_at`
)
VALUES
  (1, 'RV-2026-019', 1, 1, NULL, 'Supervisor M. Rao',
   'Filled potholes with 12 bags cold-mix asphalt, leveled and vibratory rolled to street grade.',
   'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
   'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80',
   'AWAITING_VERIFICATION', NULL, '', '2026-10-14 17:00:00', NULL);

-- -----------------------------------------------------------------------------
-- 10. Seed Citizen Feedback
-- 1-to-5 star quality feedback for resolved complaint.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `feedback` (`id`, `complaint_id`, `citizen_id`, `rating`, `comment`, `created_at`)
VALUES
  (1, 2, 1, 5, 'Very fast response! The entire corner was cleared and sanitized properly. Thank you BBMP team.', '2026-10-10 10:00:00');

-- -----------------------------------------------------------------------------
-- 11. Seed Material Requests
-- Material requisitions matching INITIAL_MATERIAL_REQUESTS.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `material_requests` (
  `id`, `request_code`, `work_order_id`, `complaint_id`, `department_id`,
  `requested_by_user_id`, `requested_by_name`, `status`, `reason`,
  `decision_notes`, `decided_by_user_id`, `request_date`, `decided_at`
)
VALUES
  (1, 'MR-2026-042', 1, 1, 1, NULL, 'Supervisor M. Rao', 'APPROVED',
   'Repairing 3 potholes on CMH Road carriageway.',
   'Approved based on standard ward road maintenance quota.', 4, '2026-10-12 11:30:00', '2026-10-12 11:45:00');

-- -----------------------------------------------------------------------------
-- 12. Seed Material Request Items
-- Line items associated with material requests.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `material_request_items` (`id`, `material_request_id`, `inventory_item_id`, `requested_qty`, `approved_qty`)
VALUES
  (1, 1, 1, 12, 12);

-- -----------------------------------------------------------------------------
-- 13. Seed Inventory Transactions
-- Audit trail of stock deductions when material was dispatched.
-- Reconciles with inventory_items: starting 120 - 12 dispatched = 108 balance_after.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `inventory_transactions` (
  `id`, `inventory_item_id`, `transaction_type`, `quantity_change`,
  `balance_after`, `material_request_id`, `work_order_id`, `reason`,
  `performed_by_user_id`, `created_at`
)
VALUES
  (1, 1, 'STOCK_DISPATCH', -12, 108, 1, 1,
   'Dispatched for Work Order #WO-2026-088', 4, '2026-10-12 11:45:10');

-- -----------------------------------------------------------------------------
-- 14. Seed Notifications
-- User and role-targeted notifications matching INITIAL_NOTIFICATIONS.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `notifications` (
  `id`, `notification_code`, `user_id`, `target_role`, `title`, `message`,
  `link_type`, `link_id`, `is_read`, `created_at`
)
VALUES
  (1, 'NOTIF-01', 1, 'CITIZEN', 'Repair In Progress',
   'Work order #WO-2026-088 has been issued for your complaint #CC-2026-1041 (Roads & Potholes).',
   'COMPLAINT', 'CC-2026-1041', FALSE, '2026-10-12 10:25:00'),

  (2, 'NOTIF-02', 1, 'CITIZEN', 'Complaint Resolved — Please Rate',
   'Your complaint #CC-2026-1038 has been resolved by Municipal Officer. Please share your rating and feedback.',
   'COMPLAINT', 'CC-2026-1038', TRUE, '2026-10-09 16:50:00'),

  (3, 'NOTIF-03', 4, 'OFFICER', 'New Critical Complaint Reported',
   'Citizen Anand Varma reported drinking water pipeline fracture (#CC-2026-1035). Requires immediate inspection.',
   'COMPLAINT', 'CC-2026-1035', FALSE, '2026-10-12 07:20:00'),

  (4, 'NOTIF-04', 4, 'OFFICER', 'Work Order Overdue Alert',
   'Work Order #WO-2026-092 (Water Supply & Sewerage) has exceeded its target resolution deadline.',
   'WORK_ORDER', 'WO-2026-092', FALSE, '2026-10-15 08:00:00'),

  (5, 'NOTIF-05', 4, 'OFFICER', 'Repair Awaiting Verification',
   'Supervisor M. Rao submitted completion photos for complaint #CC-2026-1041. Please verify and approve.',
   'REPAIR_VERIFICATION', 'RV-2026-019', TRUE, '2026-10-14 17:05:00');

-- -----------------------------------------------------------------------------
-- 15. Seed Duplicate Reviews
-- Algorithmic duplicate candidate matches matching INITIAL_DUPLICATES.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `duplicate_reviews` (
  `id`, `review_code`, `original_complaint_id`, `suspected_complaint_id`,
  `match_type`, `similarity_score`, `review_status`, `review_reason`,
  `reviewed_by_user_id`, `reviewed_at`
)
VALUES
  (1, 'DUP-2026-01', 1, 4,
   'Geospatial & Perceptual Image Similarity (Simulated)', 94,
   'PENDING_REVIEW', '', NULL, NULL);

-- -----------------------------------------------------------------------------
-- 16. Seed Audit Logs
-- System actions matching INITIAL_AUDIT_LOGS.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `audit_logs` (
  `id`, `audit_code`, `user_id`, `actor_name`, `action`,
  `entity_type`, `entity_id`, `affected_record`, `details`, `created_at`
)
VALUES
  (1, 'AUDIT-101', 1, 'Priya Sharma (Citizen)', 'SUBMIT_COMPLAINT',
   'COMPLAINT', 'CC-2026-1041', 'Complaint #CC-2026-1041',
   'Submitted new civic report "Severe pothole cluster near Metro Pillar 142" with 1 photo.', '2026-10-10 09:30:22'),

  (2, 'AUDIT-102', 4, 'Er. Rajesh Kumar (Municipal Officer)', 'APPROVE_MATERIAL_REQUEST',
   'MATERIAL_REQUEST', 'MR-2026-042', 'Material Request #MR-2026-042',
   'Approved 12 bags of Cold-Mix Asphalt for Work Order #WO-2026-088.', '2026-10-12 11:45:10'),

  (3, 'AUDIT-103', 4, 'Er. Rajesh Kumar (Municipal Officer)', 'CREATE_WORK_ORDER',
   'WORK_ORDER', 'WO-2026-088', 'Work Order #WO-2026-088',
   'Assigned pothole repair to Roads & Bridges Dept with HIGH priority.', '2026-10-12 10:20:04'),

  (4, 'AUDIT-104', 4, 'Er. Rajesh Kumar (Municipal Officer)', 'VERIFY_AND_RESOLVE',
   'COMPLAINT', 'CC-2026-1038', 'Complaint #CC-2026-1038',
   'Inspected post-cleanup evidence and transitioned status to RESOLVED.', '2026-10-09 16:45:00'),

  (5, 'AUDIT-105', 1, 'Priya Sharma (Citizen)', 'SUBMIT_FEEDBACK',
   'COMPLAINT', 'CC-2026-1038', 'Complaint #CC-2026-1038',
   'Submitted 5-star resolution rating: "Very fast response! The entire corner was cleared..."', '2026-10-10 10:00:15');
