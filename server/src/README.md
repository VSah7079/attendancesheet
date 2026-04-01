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
