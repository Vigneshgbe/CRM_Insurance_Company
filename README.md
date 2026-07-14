# CRM - Insurance Case Management System

**Ontario MVA Insurance Case Management System**

Developed by **Padak Pvt Ltd** for **Matrix Legal Services** under Contract `HN-CRM-2026-001` (with addendum `HN-CRM-2026-002`).

Hypernova CRM is a modern, web-based rebuild of a legacy desktop CRM (ACT!-style) used to manage motor vehicle accident (MVA) insurance claim cases. The system is **case-based**: every record revolves around the `Client → Case → Modules` hierarchy, with **Case ID** as the central reference throughout the application and database.

---

## ✨ Features

- **Client Management** — client profiles, contact details, ID documents (incl. OHIP), client email editing
- **Case Management** — case creation, case type tracking, status workflow with full status history
- **Accident / Claim Details** — accident information, claim status, mediation/arbitration, limitation dates
- **Insurance Tracking** — no-fault insurer, third-party insurer, adjusters, claim & policy numbers, independent companies
- **Medical Records** — hospitals, medical providers, treatments, specialists
- **Employment Information** — full-time / part-time employers, employment status checkboxes
- **Lawyers Module** — our lawyer / previous lawyer / transferred lawyer per case
- **Settlement Tracking** — settlement amounts, legal fees, HST, outstanding balances, client payouts
- **Document Management** — rich-text Document Editor with autosave, PDF & DOCX export
- **OCF Government Form Generation** — auto-fills real fillable Ontario OCF PDF forms (OCF-1, OCF-2, OCF-3, …) from case data via a Python `pypdf` pipeline (not drawn from scratch)
- **Activities & Notes** — calls, emails, appointments, tasks, and case updates with activity logging
- **Email Notifications** — automatic SMTP notifications on case status changes and new activities, with an `email_log` audit table and fail-safe guards (email failure never blocks a save)
- **Dashboard** — stat cards, case status donut chart, trend sparkline (pure SVG), mini calendar with limitation date highlighting, quick actions, recent activities
- **Calendar Page** — navigable monthly grid with limitation date pills, filters, and stat cards
- **Authentication** — JWT-based auth with `employee` and `client` roles; client portal (Phase 1+)
- **Branded UI** — bronze/copper theme derived from the Matrix Legal Services identity

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| UI | Tailwind CSS + ShadCN UI |
| State / Data | TanStack Query, React Hook Form |
| Package Manager (FE) | Bun |
| Backend | Node.js + TypeScript + Express.js |
| Database | MySQL (via XAMPP), raw `mysql2` queries — **no ORM** |
| Auth | JWT (8h expiry), roles: `employee`, `client` |
| PDF Generation | `pdf-lib` + Python (`pypdf`, `cryptography`) for OCF fillable-form filling |
| Email | Nodemailer over Gmail SMTP (App Password) |

**Ports:** Backend `5000` · Frontend `8080`
**Database:** `padak_insurance_crm` (31 tables)

---

## 📁 Project Structure

```
CRM_Phase_1/
├── backend/
│   ├── src/
│   │   ├── config/          # DB pool (default export)
│   │   ├── controllers/     # Business logic per module
│   │   ├── routes/          # All routes registered in index.ts
│   │   ├── middlewares/     # Auth (JWT), error handling
│   │   ├── utils/           # helpers (generateId), etc.
│   │   └── types/
│   ├── templates/ocf/       # Government OCF PDF templates
│   ├── fill_fillable_fields.py
│   └── extract_form_field_info.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── case-tabs/   # 22 case tab components
    │   │   └── forms/ocf/   # OCF form UIs
    │   ├── pages/           # 18 pages (Dashboard, Cases, Calendar, ...)
    │   ├── layouts/         # AppHeader, AppSidebar, AppLayout
    │   ├── lib/             # auth.tsx, constants.ts, formatters.ts
    │   └── data/            # mockData.ts (data shape source of truth)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun (frontend)
- XAMPP (MySQL)
- Python 3 with `pypdf` and `cryptography` (`pip install pypdf cryptography`)

### Database

1. Start MySQL via XAMPP.
2. Create database `padak_insurance_crm` and import the schema (31 tables).

### Backend

```bash
cd backend
npm install
# Configure .env: DB credentials, JWT_SECRET, SMTP app password
npm run dev   # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
bun install
bun run dev   # runs on http://localhost:8080
```

API base URL is configured in `src/lib/constants.ts`. All backend routes use the `/api` prefix.

---

## 🔑 Key Conventions

- Auth token stored as `crm_token` (localStorage); user object as `crm_user` (sessionStorage)
- Frontend tab → backend mapping: `ThirdPartyTab.tsx` → `case_third_party` table → `/api/cases/:id/third-party`
- SQL pattern: `SELECT-then-INSERT/UPDATE` (no `ON DUPLICATE KEY UPDATE` without a confirmed UNIQUE constraint)
- Backend responses match `mockData.ts` shapes exactly for seamless frontend integration
- Each OCF PDF has its own internal field ID format — field IDs are always extracted from the actual government PDF before mapping

---

## 🗺 Roadmap

- Connect remaining frontend tabs to live APIs (Third Party, No-Fault, Medical, Employment, Settlement, and more)
- Complete OCF PDF pipeline for all remaining form templates
- Client Portal API (`/api/portal/*`)
- Reports API
- Signature pad backend integration

---

## 📄 License

**Proprietary — All Rights Reserved.**

Copyright © 2026 **Padak Pvt Ltd**. Developed under Contract `HN-CRM-2026-001` for **Matrix Legal Services**.

This software and its source code are the confidential and proprietary property of Padak Pvt Ltd and/or Matrix Legal Services. No part of this repository may be copied, modified, distributed, sublicensed, or used in any form, in whole or in part, without prior written permission from Padak Pvt Ltd.

Unauthorized use, reproduction, or distribution of this software is strictly prohibited and may result in civil and criminal penalties.

---

## 📬 Support

For support or inquiries, contact: **vignesh.g@thepadak.com**
