# Product & Buyer Management System (PBMS)

Internal admin panel for managing products, companies, contacts, and product-company mappings.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Ant Design v5 |
| State | Zustand + TanStack Query |
| Routing | React Router v7 |
| Backend | Node.js (v22+) + Express.js |
| ORM | Prisma 6.x |
| Database | MySQL 8.x |
| Auth | JWT (access 15min + refresh 7d HttpOnly cookie) |

## Prerequisites

- Node.js v20.17+ or v22+
- MySQL 8.x running locally
- npm

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Jwanil/pbms.git
cd pbms
```

### 2. Install server dependencies
```bash
cd server && npm install
```

### 3. Configure environment
```bash
cp .env.example .env.development
# Edit .env.development with your MySQL credentials and JWT secrets
```

### 4. Run database migrations
```bash
npx prisma migrate dev
```

### 5. Seed default data
```bash
npx prisma db seed
# Creates: 3 roles, 33 permissions, 1 super admin user, and all master data
```

### 6. Start the backend (runs on port 5001)
```bash
npm run dev
```

### 7. Install and start the frontend (new terminal)
```bash
cd ../client && npm install && npm run dev
# Runs on http://localhost:5173
```

## Default Login Credentials
```
Email:    admin@pbms.com
Password: Admin@123
```
Change this password immediately after first login.

## API Documentation
Swagger UI: http://localhost:5001/api/v1/docs

## Project Structure
```
/client       React 19 + Vite frontend (JSX + JS)
  /src/pages        One folder per module
  /src/components   Shared reusable UI components
  /src/store        Zustand stores
  /src/api          Axios instance + React Query hooks
/server       Express.js backend (JS)
  /src/routes/v1    All API routes under /api/v1/
  /src/controllers  Controller logic per module
  /src/middleware   Auth, roleGuard, errorHandler
  /src/services     Business logic layer
  /src/utils        Response formatter, logger, swagger
  /prisma           schema.prisma, migrations, seed.js
```

## API Overview
The backend provides the following REST APIs under `/api/v1/`:
- `/auth`: Login, logout, token refresh, `/me` profile.
- `/dashboard`: KPI counts, charts, activity feed.
- `/products`: Product master CRUD.
- `/companies`: Company master and branch management CRUD.
- `/mappings`: Product-to-Company mapping CRUD.
- `/contacts`: Contact master and product interests CRUD.
- `/categories`, `/grades`, `/packaging`, `/departments`: Setup master CRUD.
- `/users`: User and permission management CRUD.

## Phase Progress
- `[x]` Phase 1 — Project Setup & Architecture
- `[x]` Phase 2 — Authentication & User Management
- `[x]` Phase 3 — Master Data Modules
- `[x]` Phase 4 — Product Master & Company Master
- `[x]` Phase 5 — Company Product Mapping & Contact Master
- `[x]` Phase 6 — Dashboard & Workflow Integration
- `[x]` Phase 7 — Comprehensive Form Validations
- `[x]` Phase 8 — User-Level Permissions Refactor
- `[x]` Phase 9 — Comprehensive QA Sweep, Bug Fixes & Polish
- `[ ]` Phase 10 — Final Deployment & Handoff