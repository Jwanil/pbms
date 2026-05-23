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

## Phase Progress
- [x] Phase 1 — Project Setup & Architecture (Days 1–2)
- [ ] Phase 2 — Authentication & User Management (Days 3–4)
- [ ] Phase 3 — Master Data Modules (Days 5–6)
- [ ] Phase 4 — Product Master & Company Master (Days 7–9)
- [ ] Phase 5 — Company Product Mapping & Contact Master (Days 10–11)
- [ ] Phase 6 — Dashboard & Workflow Integration (Days 12–13)
- [ ] Phase 7 — QA, Security & Deployment (Day 14)
