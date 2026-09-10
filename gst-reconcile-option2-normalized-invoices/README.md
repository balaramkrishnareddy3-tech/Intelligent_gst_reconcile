# GST RECONCILE

Intelligent GST Reconciliation and ITC Risk Analysis enterprise web application built with React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Lucide icons, and D3.js.

GST RECONCILE provides separate role-based portals for Company users, Vendor/Supplier users, and Admin users. The application includes GST reconciliation workflows, ITC risk analysis, vendor compliance scoring, transaction knowledge graph visualization, audit trails, reports, a GSTN-style GSTR-2B gateway prototype, live transaction feed, notifications, and an AI-style in-app chatbot.

## Live Roles and Demo Credentials

Use the following prototype credentials:

| Role | Login Route | Email / Admin ID | Password | Redirect |
|---|---|---|---|---|
| Company | `/login/company` | `company@demo.com` | `company123` | `/company/dashboard` |
| Vendor / Supplier | `/login/vendor` | `vendor@demo.com` | `vendor123` | `/vendor/dashboard` |
| Admin | `/login/admin` | `admin@demo.com` | `admin123` | `/admin/dashboard` |

Authentication is prototype-only and persisted using `localStorage`.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Zustand for centralized state
- D3.js for transaction knowledge graph
- Lucide React icons
- localStorage persistence for prototype data and sessions

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```bash
http://localhost:5173
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```text
src/
  App.tsx
  main.tsx
  index.css
  components/
    chatbot/
    dock/
    gstr2b/
    gstn/
    guards/
    guide/
    layouts/
    notify/
    ui/
  pages/
    admin/
    company/
    login/
    vendor/
  services/
    gstApi.ts
  store/
    authStore.ts
    gstStore.ts
    notifyStore.ts
    uiStore.ts
  types/
    auth.ts
    gst.ts
  utils/
    cn.ts
```

## Main Routes

### Public Routes

- `/` - Landing page with Company, Vendor/Supplier, and Admin role selection
- `/login/company` - Company login
- `/login/vendor` - Vendor/Supplier login
- `/login/admin` - Admin login

### Company Routes

- `/company/dashboard`
- `/company/data-sources`
- `/company/reconciliation`
- `/company/reconciliation/results`
- `/company/mismatches`
- `/company/invoice/:id`
- `/company/itc-risk`
- `/company/vendor-risk`
- `/company/vendor-risk/:id`
- `/company/transaction-graph`
- `/company/audit-trail`
- `/company/reports`
- `/company/settings`

### Vendor Routes

- `/vendor/dashboard`
- `/vendor/invoices`
- `/vendor/mismatches`
- `/vendor/compliance`
- `/vendor/issues`
- `/vendor/reports`
- `/vendor/settings`

### Admin Routes

- `/admin/dashboard`
- `/admin/companies`
- `/admin/companies/:id`
- `/admin/vendors`
- `/admin/vendors/:id`
- `/admin/invoices`
- `/admin/invoices/:id`
- `/admin/reconciliation`
- `/admin/mismatches`
- `/admin/itc-risk`
- `/admin/transaction-graph`
- `/admin/audit-trail`
- `/admin/reports`
- `/admin/settings`

## Key Features

### Role-Based Portals

- Three isolated roles: Company, Vendor/Supplier, Admin
- Protected routes by role
- Separate sidebars and layouts for Company, Vendor, and Admin
- Users cannot access another role's protected pages

### Company Portal

- High-level company dashboard
- Live GST Transaction Feed connected to centralized invoice state
- Data source upload module for Purchase Register, GSTR-2B, GSTR-1, E-Invoice, and E-Way Bill
- 20-step reconciliation workflow
- Reconciliation results and mismatch workbench
- Invoice investigation page with field-by-field comparison
- ITC risk module
- Vendor risk scoring and vendor dossiers
- Interactive D3 transaction knowledge graph
- Audit trail and reports

### Live GST Transaction Feed

The Company Dashboard includes a prototype live feed that simulates real-time GST transaction ingestion.

Live transactions are not stored separately. They are added to the same centralized `invoices` store, so they immediately appear in:

- Company Dashboard
- Reconciliation Results
- Invoice Investigation
- ITC Risk
- Vendor Risk
- Transaction Graph
- Audit Trail
- Reports

The feed supports:

- LIVE / PAUSED state
- Pause and resume
- Live counters
- New transaction toast
- Clickable transaction rows
- Centralized audit event generation

### Admin Portal

- System-wide dashboard
- Company management with tenant onboarding, status toggle, dossier view, and exports
- Vendor monitoring and vendor dossiers
- Global invoice registry and invoice investigation
- Reconciliation monitoring with batch telemetry and retry handling
- Mismatch monitoring with resolution workflow
- ITC risk monitoring and risk reassessment
- Admin transaction knowledge graph
- System-wide audit trail
- Reports and settings

### Transaction Knowledge Graph

The Company and Admin graph modules use D3.js and centralized reconciliation data.

Graph entities include:

- Company
- Vendor
- Invoice
- Purchase Record
- GST Record
- GSTIN
- Mismatch
- ITC
- Risk
- Audit Event

Supported graph behavior:

- Interactive node dragging
- Zoom and pan
- Clickable node details panel
- Search and filters
- Trace relationship
- Trace risk path

### GSTN-Style GSTR-2B Gateway Prototype

The application includes a GSTN-style API gateway console for GSTR-2B generation.

It supports:

- Sandbox mode
- Live mode attempt against a configured GSTN edge URL
- OTP verification flow
- GSTR-2B generation
- Official summary report
- JSON and CSV downloads
- Push-to-ledger integration

Important note: Direct browser access to real GSTN APIs is typically blocked by CORS, mTLS, IP whitelisting, and authorized GSP/GSTN requirements. The application honestly handles this by attempting the live edge and falling back to a sandbox/GSP bridge simulation for the prototype. It does not claim unauthorized direct government access.

### Notifications

- Live in-app notification center
- Event-driven alerts for reconciliation, GSTR-2B sync, mismatches, ITC risk, and tenant activity
- Read/unread state persisted in localStorage
- Toast notifications for new events

### History and Guidance

- Role-aware guided tour for Company and Vendor workflows
- Session history timeline
- Smart next-step guidance
- LocalStorage persistence

### Chatbot

- Global floating assistant available across the website
- Answers questions using centralized application data
- Role-aware navigation support
- Can explain GSTR-2B, GSTIN, ITC risk, mismatches, reconciliation, vendors, reports, and audit trail

## Centralized State

The application uses centralized Zustand stores:

- `authStore.ts` - role-based authentication/session persistence
- `gstStore.ts` - invoices, companies, vendors, reconciliation batches, data sources, settings, audit events, live feed transactions
- `notifyStore.ts` - notifications and unread state
- `uiStore.ts` - shared UI panel state

Prototype state is persisted in localStorage.

## Data and API Notes

- This project uses realistic seed data for invoices, GST records, vendors, companies, audit events, and reconciliation batches.
- Uploads and live feeds are prototype workflows and update the centralized in-browser store.
- GSTN/GSTR-2B integration is structured as an API gateway prototype.
- Real production GSTN integration must use authorized credentials, GSTN/GSP onboarding, server-side proxying, IP whitelisting, encryption, token handling, and compliance with GSTN terms.

## Deployment

This is a Vite app and can be deployed to most static hosts.

Common options:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- S3 + CloudFront

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Security Disclaimer

This is a prototype/demo implementation. It does not provide production-grade authentication, encrypted storage, government authentication, or direct GST portal access. For production, implement a secure backend, server-side session management, role-based permissions, encrypted secrets, audit logging, and authorized GSTN/GSP integration.

## License

Private/internal prototype. Add your organization license before public distribution.