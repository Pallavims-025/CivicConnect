# CivicConnect — MySQL Database Architecture & Setup Guide

This directory contains the production-ready MySQL 8.x database schema and initial seed data for **CivicConnect: Civic Issue Reporting and Municipal Accountability Platform**.

---

## 1. Database Architecture & Design Principles

The database is built directly on native **MySQL 8.x** with the **InnoDB** storage engine and `utf8mb4` character set (`utf8mb4_unicode_ci` collation) to guarantee full Unicode support (including multilingual civic addresses and emoji-safe fields).

### Core Design Standards
1. **Surrogate Primary Keys + Human-Readable Reference Codes:**
   - Every entity uses an internal numeric surrogate primary key (`BIGINT UNSIGNED AUTO_INCREMENT` or `INT UNSIGNED AUTO_INCREMENT`) for fast B-tree joins and primary key clustering.
   - Every customer-facing or officer-facing entity maintains a dedicated `UNIQUE` human-readable reference code column (e.g., `complaint_code` for `CC-2026-1041`, `work_order_code` for `WO-2026-088`, `item_code` for `INV-01`, `request_code` for `MR-2026-042`, `verification_code` for `RV-2026-019`, `review_code` for `DUP-2026-01`).
2. **Preservation of Application Values & Enums:**
   - Complaint Statuses: `'PENDING'`, `'UNDER_REVIEW'`, `'IN_PROGRESS'`, `'RESOLVED'`, `'REJECTED'`.
   - Priorities: `'LOW'`, `'MEDIUM'`, `'HIGH'`, `'CRITICAL'`.
   - Work Order Statuses: `'PENDING'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'OVERDUE'`, `'REWORK_REQUIRED'`.
   - Repair Verification Statuses: `'AWAITING_VERIFICATION'`, `'VERIFIED_APPROVED'`, `'REWORK_REQUESTED'`.
   - Duplicate Review Statuses: `'PENDING_REVIEW'`, `'CONFIRMED_DUPLICATE'`, `'DISMISSED'`.
   - Material Request Statuses: `'PENDING'`, `'APPROVED'`, `'REJECTED'`.
   - Stock Statuses: `'IN_STOCK'`, `'LOW_STOCK'`, `'OUT_OF_STOCK'`.
3. **Safe, Non-Destructive Execution Policy:**
   - `schema.sql` uses `CREATE TABLE IF NOT EXISTS` and does **not** silently drop existing tables.
   - `seed.sql` uses `INSERT IGNORE INTO` and does **not** silently truncate or wipe existing tables.
   - Clean development resets require deliberate, explicit user action (uncommenting the designated teardown blocks).
4. **Inventory Ledger Consistency:**
   - Stock levels and transaction audit entries are mathematically reconciled.
   - For example, item `INV-01` has a baseline stock of 120 bags; after dispatching 12 bags for work order `WO-2026-088` (requisition `MR-2026-042`), `inventory_transactions.balance_after` is recorded as `108`, and `inventory_items.available_quantity` is seeded as `108`.
5. **Security & Privacy:**
   - Seed demonstration users have `password_hash` set strictly to `NULL`. No fake hashes, working accounts, or real credentials exist in the schema or seed files.
   - Uploaded media references store paths or CDN URLs (`VARCHAR(1000)`), never raw binary blobs.

---

## 2. Table Catalog (16 Tables)

The schema defines exactly **16 tables** mapping directly to the application features:

| # | Table Name | Purpose & Domain Entity | Primary Key | Key Foreign Keys & Constraints |
|---|------------|-------------------------|-------------|--------------------------------|
| 1 | `departments` | Municipal departments (Roads, Solid Waste, Electrical, Water, etc.) | `id` (INT) | `head_officer_id` -> `users(id)` |
| 2 | `categories` | Civic issue complaint categories | `id` (INT) | `department_id` -> `departments(id)` |
| 3 | `users` | Citizens, municipal officers, and administrators | `id` (BIGINT) | `department_id` -> `departments(id)`, UNIQUE `user_code`, UNIQUE `email` |
| 4 | `complaints` | Citizen-reported civic issues with geo-coordinates and triage state | `id` (BIGINT) | `citizen_id` -> `users`, `category_id` -> `categories`, `department_id` -> `departments`, `assigned_officer_id` -> `users` |
| 5 | `complaint_photos` | Photo evidence attached to complaints (initial and post-repair) | `id` (BIGINT) | `complaint_id` -> `complaints` (CASCADE), `uploaded_by_id` -> `users` |
| 6 | `complaint_status_history` | Audit timeline tracking all status transitions and remarks | `id` (BIGINT) | `complaint_id` -> `complaints` (CASCADE), `performed_by_user_id` -> `users` |
| 7 | `work_orders` | Field repair crew assignments, deadlines, and cost estimates | `id` (BIGINT) | `complaint_id` -> `complaints`, `department_id` -> `departments`, `supervisor_id` -> `users` |
| 8 | `repair_verifications` | Field supervisor completion submissions and officer sign-offs | `id` (BIGINT) | `complaint_id` -> `complaints`, `work_order_id` -> `work_orders`, `verified_by_officer_id` -> `users` |
| 9 | `feedback` | Citizen 1-to-5 star rating and review after issue resolution | `id` (BIGINT) | `complaint_id` -> `complaints` (CASCADE, UNIQUE), `citizen_id` -> `users`, CHECK `rating >= 1 AND rating <= 5` |
| 10 | `inventory_items` | Municipal warehouse spare parts, materials, and stock thresholds | `id` (INT) | `department_id` -> `departments`, UNIQUE `item_code`, CHECK `available_quantity >= 0` |
| 11 | `material_requests` | Requisitions for repair materials raised for work orders | `id` (BIGINT) | `work_order_id` -> `work_orders`, `complaint_id` -> `complaints`, `department_id` -> `departments` |
| 12 | `material_request_items` | Line items and quantities requested and approved per requisition | `id` (BIGINT) | `material_request_id` -> `material_requests` (CASCADE), `inventory_item_id` -> `inventory_items` |
| 13 | `inventory_transactions` | Audit ledger tracking stock additions, dispatches, and adjustments | `id` (BIGINT) | `inventory_item_id` -> `inventory_items`, `material_request_id` -> `material_requests`, `work_order_id` -> `work_orders` |
| 14 | `notifications` | In-app alerts delivered to citizens or officers | `id` (BIGINT) | `user_id` -> `users` (CASCADE), UNIQUE `notification_code` |
| 15 | `duplicate_reviews` | Algorithmic duplicate candidate detection and officer decisions | `id` (BIGINT) | `original_complaint_id` -> `complaints`, `suspected_complaint_id` -> `complaints`, CHECK `orig <> susp` |
| 16 | `audit_logs` | Security and compliance audit log for all system mutations | `id` (BIGINT) | `user_id` -> `users`, UNIQUE `audit_code` |

---

## 3. Entity Relationships Diagram (ERD Overview)

```
[departments] <---------- [users]
      |                      |
      |                      | (reported by)
      +--------+             v
      |        +--------> [complaints] <---+ (original / suspected)
      v                      |     |       |
[categories]                 |     +-------+-----> [duplicate_reviews]
      |                      |
      +----------------------+ (categorized under)
                             |
         +-------------------+-------------------+
         |                   |                   |
         v                   v                   v
[complaint_photos]  [complaint_status_history]  [feedback]
                             |
                             v
                       [work_orders]
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
[repair_verifications]                  [material_requests]
                                                 |
                                                 v
[inventory_items] <----------------- [material_request_items]
         |
         v
[inventory_transactions]

[users] -------------> [notifications]
[users] -------------> [audit_logs]
```

---

## 4. Setup & Execution Instructions

### Prerequisites
- MySQL Community Server 8.0 or 8.4 LTS installed and running.
- MySQL Command Line Client (`mysql`) or MySQL Workbench installed.
- Administrative credentials for your local MySQL server (typically `root`).

---

### Method A: Running via MySQL Command Line Client (CLI)

1. Open PowerShell or Command Prompt.
2. Navigate to the project root directory:
   ```powershell
   cd "C:\Users\PALLAVI\Desktop\CivicConnect\CivicConnect"
   ```
3. Run the schema creation script (non-destructive, creates tables `IF NOT EXISTS`):
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   *(Enter your MySQL root password when prompted)*

4. Run the seed data script (non-destructive, uses `INSERT IGNORE INTO`):
   ```bash
   mysql -u root -p < database/seed.sql
   ```
   *(Enter your MySQL root password when prompted)*

5. Verify that the tables and data were created successfully:
   ```bash
   mysql -u root -p -e "USE civicconnect; SHOW TABLES; SELECT complaint_code, title, status FROM complaints;"
   ```

*Tip on Windows if `mysql` is not in your system PATH:*
Use the absolute path to `mysql.exe` (e.g., `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`):
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database/schema.sql
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database/seed.sql
```

---

### Method B: Running via MySQL Workbench (GUI)

1. Open **MySQL Workbench**.
2. Connect to your local MySQL instance (e.g., `Local instance MySQL80`).
3. Open and run the schema script:
   - Click **File** -> **Open SQL Script...**
   - Browse to `CivicConnect/database/schema.sql` and open it.
   - Click the **Execute** button (the yellow lightning bolt icon ⚡) or press `Ctrl + Shift + Enter`.
   - Check the **Action Output** pane at the bottom to confirm all 16 tables were created with green checkmarks.
4. Open and run the seed script:
   - Click **File** -> **Open SQL Script...**
   - Browse to `CivicConnect/database/seed.sql` and open it.
   - Click the **Execute** button (⚡) or press `Ctrl + Shift + Enter`.
   - Check the **Action Output** pane to confirm the seed records were inserted.
5. In the **Navigator** pane on the left, right-click on the `civicconnect` schema under **Schemas** and select **Refresh All**. Expand **Tables** to view the newly created tables.

---

### Optional: Clean Reset Instructions (Development Only)

If you explicitly wish to wipe and rebuild the database from scratch during development:

1. Open `database/schema.sql` and uncomment the `DROP TABLE IF EXISTS` block in section 1.
2. Execute `database/schema.sql`.
3. Re-comment the `DROP TABLE IF EXISTS` block to restore non-destructive safety.
4. Execute `database/seed.sql` to re-populate reference records.

---

## 5. Configuration & Environment Notes

When connecting a future backend service to this database, configure the connection URL in your environment configuration (see `.env.example` in the project root):

```ini
# MySQL Database Connection URL
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/civicconnect"
```

### Database Encoding Verification
If you need to verify that your MySQL instance is using `utf8mb4`:
```sql
SELECT @@character_set_database, @@collation_database;
```
Expected output:
```
+--------------------------+----------------------+
| @@character_set_database | @@collation_database |
+--------------------------+----------------------+
| utf8mb4                  | utf8mb4_unicode_ci   |
+--------------------------+----------------------+
```

---

## 6. Assumptions & Design Rationales

1. **Non-Destructive Defaults:**
   `schema.sql` and `seed.sql` are designed to be safe for existing data. Neither script silently drops or truncates tables. Re-running them in an existing environment will not destroy active complaint records or operational data.
2. **Prisma Reference Schema:**
   The existing `prisma/schema.prisma` was inspected as a reference for existing models (`User`, `Category`, `Complaint`, `ComplaintPhoto`, `Feedback`). The new schema expands upon this foundation by adding the full operational workflows implemented in the frontend application (`departments`, `work_orders`, `repair_verifications`, `inventory_items`, `material_requests`, `material_request_items`, `inventory_transactions`, `notifications`, `duplicate_reviews`, and `audit_logs`). Prisma is **not** a requirement for running this SQL schema.
3. **Circular Foreign Key Resolution (`departments` <-> `users`):**
   `departments` references a department head officer in `users`, while `users` references an officer's assigned department in `departments`. To prevent circular dependency errors during table creation, `departments` is created first without the foreign key, and `fk_departments_head_officer` is attached conditionally via dynamic SQL after `users` has been created.
4. **Seed Data Dependency Order:**
   `database/seed.sql` populates records in strict relational dependency order (`departments` -> `categories` -> `users` -> `inventory_items` -> `complaints` -> `complaint_photos` -> `complaint_status_history` -> `work_orders` -> `repair_verifications` -> `feedback` -> `material_requests` -> `material_request_items` -> `inventory_transactions` -> `notifications` -> `duplicate_reviews` -> `audit_logs`).
