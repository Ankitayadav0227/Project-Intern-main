# Intern Management System - Railway Deployment

## What was fixed

- Automatic MySQL schema initialization on backend startup.
- Added the missing `messages` table.
- Added database health endpoint: `/health`.
- Added `/test-db` database inspection endpoint.
- Fixed Attendance intern loading (`/admin/interns`).
- Fixed Manage Interns update route (`/admin/interns/:id`).
- Fixed Admin Dashboard's old localhost API URL.
- Fixed Admin Messages mark-as-read endpoint.
- Admin Messages now lists interns even before they have a conversation.
- Added safer FormData handling for message/file uploads.
- Added idempotent schema migrations for columns used by the app.
- Added Gunicorn for Railway production serving.
- Removed the need to manually run `init_db.py` after every deployment.
- Frontend uses the same-origin API in production and localhost Flask in Vite development.

## Railway setup

1. Create/connect a Railway MySQL service to the backend service.
2. Make sure the backend service receives the MySQL variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
3. Deploy this repository with the included root `Dockerfile`.
4. Open:
   - `/health`
   - `/test-db`
   - `/api`
5. The first backend startup creates the required tables without deleting existing data.

## Default admin

If no `admin` account exists, startup creates:

- Username: `admin`
- Password: `admin123`

Change this password after the first successful login.

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

For local MySQL, copy `backend/.env.example` to `backend/.env` and configure the database variables in your shell/environment. The application does not require `.env` to be committed.
