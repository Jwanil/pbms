# PBMS Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- Git

## 1. Clone & Install

```bash
git clone <repository_url>
cd <repository>

# Install Backend
cd server
npm install

# Install Frontend
cd ../client
npm install
```

## 2. Environment Setup

Create `.env.development` in `server/`:
```env
PORT=5001
DATABASE_URL="mysql://root:password@localhost:3306/pbms_db?socket=/tmp/mysql.sock"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

Create `.env.local` in `client/`:
```env
VITE_API_URL="http://localhost:5001/api/v1"
```

## 3. Database Migration & Seeding

Important: Prisma needs the .env variables. Run the following in `server/`:

```bash
export $(cat .env.development | xargs)
npx prisma migrate dev --name init
npx prisma db seed
```

## 4. Run Development Servers

Start Backend (in `server/`):
```bash
npm run dev
```
Start Frontend (in `client/`):
```bash
npm run dev
```

## Default Credentials
- **Email:** `admin@pbms.com`
- **Password:** `Admin@123`
