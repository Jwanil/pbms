# Product & Buyer Management System (PBMS)

Internal Admin Panel for managing products, buyers, companies, and contacts.

## Tech Stack

- **Frontend:** React 19 + Vite, Ant Design, React Router 7, Zustand, React Query
- **Backend:** Express.js, Node.js
- **Database:** MySQL 8.x + Prisma ORM
- **Language:** JavaScript (JSX for frontend, JS for backend) — no TypeScript

## Project Structure

```
├── client/          → React 19 + Vite frontend
│   └── src/
│       ├── pages/       → Module pages
│       ├── components/  → Shared UI components
│       ├── store/       → Zustand stores
│       └── api/         → React Query hooks
│
├── server/          → Express.js backend
│   ├── src/
│   │   ├── routes/v1/     → API routes
│   │   ├── controllers/   → Controller logic
│   │   ├── middleware/     → Auth, error handling
│   │   ├── services/      → Business logic
│   │   └── utils/         → Helpers, logger
│   └── prisma/
│       ├── schema.prisma  → Database schema
│       ├── seed.js        → Seed data
│       └── migrations/    → Auto-generated
```

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- MySQL 8.x running locally
- npm

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jwanil/pbms.git
   cd pbms
   ```

2. **Install dependencies:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. **Configure environment:**
   ```bash
   cp server/.env.example server/.env.development
   # Edit .env.development with your MySQL credentials
   ```

4. **Run migrations:**
   ```bash
   cd server
   npx prisma migrate dev
   ```

5. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

6. **Start the servers:**
   ```bash
   # Terminal 1 — Backend
   cd server && npm run dev

   # Terminal 2 — Frontend
   cd client && npm run dev
   ```

7. **Access the app:**
   - Frontend: http://localhost:5173
   - API: http://localhost:5001/api/v1/health
   - Swagger: http://localhost:5001/api/v1/docs

### Default Admin Credentials

- **Email:** admin@pbms.com
- **Password:** Admin@123
- ⚠️ Change this password immediately after first login.

## API Response Format

```json
// Success
{ "success": true, "message": "...", "data": {} }

// Paginated
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "success": false, "message": "...", "errors": [], "code": "VALIDATION_ERROR" }
```

## License

ISC
