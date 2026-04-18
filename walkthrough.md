# DBMS Bank Management System: Walkthrough

I have successfully built the complete architectural foundation, database schema, and web interface for your strong DBMS-focused project. Based on your request to use **Supabase (PostgreSQL)**, the system fully utilizes advanced backend capabilities.

## What Was Built

### 1. Database schema (`database/schema.sql`)
The PostgreSQL script designed specifically for Supabase's SQL Editor handles all your heavy DBMS requirements:
- **Normalization & Constraints**: Designed in 3NF with `PRIMARY KEY`, `FOREIGN KEY` (with `ON DELETE CASCADE`), `CHECK` for positive balances, and `UNIQUE` constraints.
- **Stored Procedures (Pl/pgSQL)**: Built `sp_transfer_funds` utilizing ACID transactional bounds. Automatic `ROLLBACK` happens natively inside PostgreSQL on any raised `EXCEPTION` (like insufficient balance or invalid accounts).
- **Triggers**: Added `trg_log_transaction` to auto-insert into Audit Logs, and `trg_check_suspicious` to dynamically set `is_suspicious = true` if a transaction amount exceeds 2x the user's historical average transfer.
- **Views**: Formulated `vw_user_summary` and `vw_admin_dashboard` for fast frontend data retrieval.
- **Indexing**: Applied indexing on highly searched columns like `phone_number` and `created_at`.

### 2. Python Flask Backend (`backend/app.py`)
A fast API layer using `psycopg2` to communicate directly with your Supabase Postgres database.
- Implemented `/api/user/register` and `/api/user/login` (with mocked OTP flow for demo simplicity).
- Implemented `/api/user/transfer` which securely calls the database's _Stored Procedure_ via `CALL sp_transfer_funds()`.
- Implemented `/api/admin/dashboard` that queries your analytical views.

### 3. Sleek Frontend (`frontend/*.html`)
Following premium and vibrant UI design principles:
- Fully functional Login, Registration, User Dashboard, and Admin Dashboard.
- **Danger Signs**: Admin dashboard visibly flanks suspicious users mimicking an alert matrix `🚨 flagged`.

## How to Deploy & Test

> [!IMPORTANT]
> Make sure you install the backend dependencies before you begin.
> **Inside `backend/` directory run:** `pip install -r requirements.txt`

1. **Setup Supabase Database**:
   - Create a project on Supabase and open the **SQL Editor**.
   - Copy the contents of `database/schema.sql` and click **Run**.
2. **Setup Backend**:
   - Rename `backend/.env.example` to `.env`.
   - Update it with your Supabase PostgreSQL URI (it looks like `postgresql://postgres...`).
   - Run `python app.py` (ensure you're in the `backend/` folder).
3. **Launch Frontend**:
   - Once the Flask server is running at `localhost:5000`, open `frontend/index.html` in any browser.
   - You can create a new user account, log in, view the dashboard, and transfer funds.
   - For Admin login, you can log in with:
     - **Username**: `admin`
     - **Password**: `admin123`
     - Here you will see the database views reflecting transaction activity and flagged high amounts.
