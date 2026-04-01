# Attendance MERN App

This project is a full-stack MERN attendance system converted from your Google Apps Script logic.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Project Structure

- `client` -> React dashboard UI
- `server` -> REST API with MongoDB models
- `Code.gs` and `Index (1).html` -> old Apps Script files (kept for reference)

## Features

- Employee management (add, list, delete)
- Attendance management (add, list, edit, delete)
- Attendance sorted latest-first
- Automatic amount calculation in UI (`hours / 8 * dailyRate`)
- Duplicate prevention for attendance per employee+date
- Generated unique IDs for employees and attendance records

## Setup

1. Install dependencies in all packages:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

2. Create environment file:

- Copy `server/.env.example` to `server/.env`
- Set your MongoDB URL in `MONGODB_URI`
- If Atlas blocks your network/IP, either whitelist your current IP in Atlas Network Access or use local MongoDB with `MONGODB_FALLBACK_URI=mongodb://127.0.0.1:27017/attendance`

3. Run both frontend + backend:

```bash
npm run dev
```

4. Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

## API Endpoints

### Employees

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/by-name/:name`
- `DELETE /api/employees/by-name/:name`

### Attendance

- `GET /api/attendance`
- `POST /api/attendance/bulk`
- `PUT /api/attendance/:rowNum`
- `DELETE /api/attendance/:rowNum`

## Data Cleanup (Optional)

If old data exists before uniqueness rules, run cleanup before enforcing indexes.

```bash
# preview only
npm run data:cleanup:dry

# apply changes
npm run data:cleanup:apply
```

## Deploy On Vercel (Frontend + Backend)

Deploy frontend and backend as two separate Vercel projects.

### 1) Deploy Backend (server)

- In Vercel, create a new project from `server` folder.
- Framework: Other
- Root Directory: `server`
- Add environment variable:
	- `MONGODB_URI=<your-atlas-connection-string>`
- Deploy.

Backend endpoints will be available at:

- `https://<your-backend>.vercel.app/api/health`
- `https://<your-backend>.vercel.app/api/employees`
- `https://<your-backend>.vercel.app/api/attendance`

### 2) Deploy Frontend (client)

- In Vercel, create another project from `client` folder.
- Framework: Vite
- Root Directory: `client`
- Add environment variable:
	- `VITE_API_BASE_URL=https://<your-backend>.vercel.app/api`
- Deploy.

### 3) Verify

- Open frontend URL and test employee/attendance CRUD.
- If API calls fail with CORS, redeploy backend after checking environment variables.
