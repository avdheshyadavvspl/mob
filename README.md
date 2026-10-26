# Multi-Tenant Attendance-to-Payroll System

Built with **React**, **PostgreSQL**, **TypeScript**, and **Node.js (Express & Modular Architecture)**.

## Quick Start

### 1. Database Setup
PostgreSQL database `payroll_db` is configured in `backend/.env`.
Run migrations and seeds:
```powershell
cd backend
npm run db:migrate
npm run db:seed
```

### 2. Run Tests (11/11 Passed)
```powershell
cd backend
npm test
```

### 3. Start Development Servers
**Backend:**
```powershell
cd backend
npm run dev
# Running on http://localhost:5000
```

**Frontend:**
```powershell
cd frontend
npm run dev
# Running on http://localhost:3000
```

## Demo Credentials
- **Company A (Acme Corp)**:
  - Admin: `admin@acme.com` / `password123`
  - Employee (Ramesh): `ramesh@acme.com` / `password123`
  - Employee (Priya): `priya@acme.com` / `password123`
- **Company B (Globex Inc)**:
  - Admin: `admin@globex.com` / `password123`
  - Employee (John Doe): `john@globex.com` / `password123`

See [DESIGN.md](file:///c:/Users/avdhe/Downloads/Mobius/DESIGN.md) for the design note, mathematical models, and architecture.
