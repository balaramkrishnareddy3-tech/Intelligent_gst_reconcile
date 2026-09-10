# Intelligent GST Reconciliation — FastAPI + Supabase

This backend is the Supabase version of the project. The original React/Vite frontend is preserved.

## 1. Create Supabase project

Create a project at https://supabase.com/dashboard.

Then open **SQL Editor**, paste the complete contents of `supabase_schema.sql`, and run it once.

## 2. Get backend credentials

In your Supabase project, copy:

- Project URL
- Backend-only service role key (or the current secret/server key available in your project settings)

Do **not** put this secret key in the React/Vite frontend or commit it to Git.

## 3. Configure `.env`

Copy `.env.example` to `.env` and fill:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_BACKEND_ONLY_SECRET
```

No GSTIN is required for this local demo backend. Demo GST records are seeded into Supabase.

## 4. Install and run

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Or use `run.bat` / `run.ps1` after `.env` has been configured.

API docs: http://127.0.0.1:8000/docs

Health: http://127.0.0.1:8000/api/health

## Demo accounts

- admin@demo.com / admin123
- company@demo.com / company123
- vendor@demo.com / vendor123

These are demo credentials only. Production authentication should use Supabase Auth or another secure identity system and hashed passwords.

## API groups

- `/api/auth`
- `/api/invoices`
- `/api/vendors`
- `/api/reconciliation`
- `/api/dashboard`
- `/api/fraud`
- `/api/notifications`
- `/api/graph`
- `/api/gst`
- `/api/chat`

## Architecture

React/Vite -> FastAPI -> Supabase PostgreSQL

GST sandbox integration remains optional and can be added later as an external provider. Supabase is the database layer, not a replacement for the GST API provider.


## Upload -> Supabase -> GSTR-2B demo flow

1. Run `supabase_schema.sql` once in Supabase SQL Editor.
2. Create `backend/.env` from `.env.example` and add your Supabase URL and service-role/secret key.
3. In `backend`, create/activate `.venv`, run `pip install -r requirements.txt`.
4. Start FastAPI:
   `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
5. From the project root, run `npm install` and `npm run dev`.
6. Login as the demo vendor (`vendor@demo.com` / `vendor123`).
7. Open **Upload Invoice**. Upload CSV/XLSX/JSON containing at least `invoice_number`. Other supported columns include `invoice_date`, `vendor_gstin`, `vendor_name`, `taxable_value`, `cgst`, `sgst`, `igst`, `total_gst`, and `total_value`.
8. Click **Upload & Save to Supabase**. The uploaded invoice rows are parsed by FastAPI, inserted into the `invoices` table, and immediately shown on the page.
9. Click **Generate GSTR-2B**. This calls `/api/gst/gstr2b` and builds a demo GSTR-2B statement from the saved Supabase invoice records. No GSTIN or live GSTN credentials are required.
10. Open **My Invoices** to see the saved records again; the page loads them from FastAPI/Supabase instead of static mock rows.

This GSTR-2B is a demo/simulated statement for development. It is not a live government GSTN statement.

## Flexible invoice normalization
The upload parser now accepts both standard tabular GST files and layout-style invoice exports. For CSV/XLSX files without a normal header row, it can extract invoice number, issue date, supplier name, subtotal/taxable value, tax amount, GST components when present, and total from labeled rows such as `Invoice #:`, `Date issued:`, `Subtotal`, `Tax (8%)`, and `TOTAL DUE`.

Uploaded records are persisted in Supabase and synchronized into the frontend reconciliation ledger, so the existing GSTR-2B report modal can display the normalized invoice instead of generating a random record count.
