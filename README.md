# CivicConnect — Complete Customer + Municipal Officer + System Administrator Dashboards

CivicConnect is a modern, unified civic issue reporting and municipal operations platform. It features three connected role-based dashboards:
1. **Customer (Citizen) Dashboard:** For reporting civic hazards (potholes, streetlights, garbage, water leaks, drainage) with photos & GPS coordinates, tracking resolution timelines, and submitting feedback.
2. **Municipal Officer Dashboard:** For triaging complaints, automated duplicate detection, dispatching work orders, managing warehouse inventory, verifying field repair evidence, and inspecting analytics.
3. **System Administrator Dashboard:** For platform telemetry, resolution rate KPIs, master user & role access control, municipal department configuration, and live audit tracking.

All dashboards are interconnected via a centralized **shared application state (React Context)**, allowing realistic end-to-end demonstrations where actions in one dashboard immediately update the others.

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Package Manager**: npm

### 2. Install & Start Development Server
Open your terminal in `CivicConnect` and run:

```bash
# Install dependencies
npm install

# Start the Express API and Vite frontend together
npm run dev
```

Before starting, copy `.env.example` to `.env` and configure `DATABASE_URL` and `JWT_SECRET`. The API runs on port 5000 and Vite on port 5173; signup and login require both services and a reachable MySQL database.

### Initial Administrator Account

Before starting the app, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (at least 12 characters) in your local `.env` file. You can optionally set `ADMIN_NAME`; if omitted, the email name is used. Then run the one-time setup command from the project directory:

```bash
npm run seed:admin
```

The script hashes the password with the same bcrypt settings used by login and inserts an approved `ADMIN` into the existing `users` table. It refuses to create another administrator if any `ADMIN` account already exists. The setup values are used only by this local command; there is no public administrator signup or provisioning endpoint. Sign in from the existing login page with `ADMIN_EMAIL` and `ADMIN_PASSWORD` to access `/admin`.

The application will be live at:
👉 **`http://localhost:5173/`**

### 3. Production Build & Preview
To test a production bundle:
```bash
npm run build
npm run preview
```

---

## 🎨 Design System & Visual Palette

All dashboards share the same design language:
- **Primary Blue:** `#2563EB`
- **Dark Navy Sidebar:** `#163A63`
- **Page Background:** `#F5F7FB`
- **Card Background:** `#FFFFFF`
- **Primary Text:** `#18283E`
- **Secondary Text:** `#64748B`
- **Status Badges:**
  - *Pending:* Amber (`#F59E0B`)
  - *In Progress / Review:* Blue (`#2563EB`)
  - *Resolved / Approved:* Green (`#10B981`)
  - *Overdue / Rejected:* Red (`#EF4444`)

---

## 🧭 Application Structure & Navigation

### 1. Landing Page / Role Switcher (`/`)
- Choose between **Customer Dashboard**, **Municipal Officer Dashboard**, and **System Administrator Dashboard**.
- Displays real-time system metrics (total reports, pending triage, active work orders, resolved).

### 2. Customer Dashboard (`/citizen`)
| Page | Path | Features |
|---|---|---|
| **Dashboard Home** | `/citizen` | Summary KPI cards (Total, Pending, In Progress, Resolved), Recent Complaints, Tips for Swift Resolution. |
| **Report an Issue** | `/citizen/report` | Title, category dropdown, description, landmark address, GPS auto-detect, photo upload with preview, confirmation receipt. |
| **My Complaints** | `/citizen/complaints` | Search by ID/title/address, filter by status & category, sort, pagination, empty states. |
| **Complaint Details** | `/citizen/complaints/:id` | Full description, photo evidence, municipal repair verification photos, resolution timeline, and feedback trigger. |
| **My Feedback** | `/citizen/feedback` | Rate resolved complaints (1 to 5 stars), submit remarks, inspect previous ratings. |
| **My Profile** | `/citizen/profile` | Citizen profile details, residential ward, editable contact info. |
| **Help & Support** | `/citizen/help` | Step-by-step reporting guide, status lifecycle guide, FAQ accordion, municipal emergency directory. |

### 3. Municipal Officer Dashboard (`/officer`)
| Page | Path | Features |
|---|---|---|
| **Operations Home** | `/officer` | 5 summary cards, live Recharts status pie chart & category bar chart, high-priority list, overdue SLA alerts. |
| **Complaint Triage** | `/officer/complaints` | Complete table, filters by status/category/priority, modal to approve, assign department/priority, reject with reason, or issue work order. |
| **Complaint Map** | `/officer/map` | Geospatial grid with color-coded status pins, pin detail drawer, and list fallback. |
| **Duplicate Detection** | `/officer/duplicates` | Side-by-side comparison of primary vs suspected duplicate, similarity score, confirm & link or dismiss actions. |
| **Work Orders** | `/officer/work-orders` | Deploy work orders to supervisors & field crews, monitor deadlines, track overdue statuses. |
| **Materials & Inventory**| `/officer/inventory` | Central yard stock tracking, stock adjustments (+/-), review & approve field material requests with auto-deduction. |
| **Repair Verification** | `/officer/verifications` | Visual inspection comparing Before vs After photos, approve to mark complaint Resolved or request crew rework. |
| **Reports & Analytics** | `/officer/analytics` | Recharts intake vs resolution trendlines, category breakdown, departmental SLA compliance tables. |
| **Notifications** | `/officer/notifications` | Triage alerts, overdue work order reminders, mark as read, direct record links. |
| **Audit History** | `/officer/audit` | Chronological immutable activity log recording all simulated citizen and officer actions. |
| **Officer Profile** | `/officer/profile` | Engineer credentials, jurisdiction coverage, editable contact info. |

### 4. System Administrator Dashboard (`/admin`) — *Member 4*
| Page | Path | Features |
|---|---|---|
| **System Administration** | `/admin` | Platform telemetry, resolution rate KPIs, municipal department status, live audit event stream. |
| **User & Role Management** | `/admin/users` | Master access control table across Citizens, Officers, Supervisors, and Admins with search and filters. |
| **Department Config** | `/admin/departments` | Add and configure municipal departments and assign civic issue classification categories. |
| **Audit History** | `/admin/audit` | Chronological activity log monitoring platform operations and administrative actions. |

---

## 🔄 Cross-Dashboard Synchronization (Shared State)

All features are connected through `src/context/CivicContext.jsx`:
1. **Citizen files a complaint** → Instantly appears in the citizen's My Complaints AND the officer's Complaint Management list; triggers an officer notification.
2. **Officer approves & issues work order** → Updates complaint to `IN_PROGRESS`, adds timeline event, updates citizen's status timeline and dashboard cards.
3. **Field crew submits completion photos** → Appears in officer's **Repair Verification** page.
4. **Officer approves repair** → Complaint status transitions to `RESOLVED`, work order completes, citizen receives notification and becomes eligible to rate the repair.
5. **Citizen submits 5-star rating** → Stored in complaint record, visible in citizen details and logged in Audit History.

---

## 🗄️ Database & Backend Roadmap (MySQL Only)

Per project guidelines:
- **No PostgreSQL** or **Firebase** is used.
- The entire frontend runs client-side with rich demonstration data.
- When you are ready to persist data to a database, implement **MySQL** with a lightweight Express server:
  - Store database credentials in `.env` (use `.env.example` as a template).
  - Use tables: `users`, `categories`, `complaints`, `complaint_photos`, `feedback`, `work_orders`, `inventory_items`, `material_requests`.
  - The frontend service layers in `src/context/` can directly swap out local state mutators for `fetch('/api/...')` calls without modifying UI components.
