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
# Running on http://localhost:5050
```

**Frontend:**
```powershell
cd frontend
npm run dev
# Running on http://localhost:3000
```

## Demo Credentials (Indian Companies & Employees)

### Company A: Tata Technologies (Code: `TATA`, 22 Working Days)
- **Admin**: `admin@tata.com` / `password123` (Aarav Sharma — HR & Payroll Director)
- **Employee 1**: `ramesh@tata.com` / `password123` (Ramesh Kumar — Senior Software Engineer, Oct: 3 LOP days)
- **Employee 2**: `priya@tata.com` / `password123` (Priya Sharma — Lead UX Designer, Oct: 0 LOP days)

### Company B: Reliance Industries (Code: `RELIANCE`, 20 Working Days)
- **Admin**: `admin@reliance.com` / `password123` (Vikram Malhotra — Operations Head)
- **Employee 1**: `rohan@reliance.com` / `password123` (Rohan Verma — Cloud Architect, Oct: 2 LOP days)
- **Employee 2**: `ananya@reliance.com` / `password123` (Ananya Iyer — Cybersecurity Specialist)

See [DESIGN.md](file:///c:/Users/avdhe/Downloads/Mobius/DESIGN.md) for the design note, mathematical models, and multi-tenant security architecture.
