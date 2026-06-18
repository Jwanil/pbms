# Product & Buyer Management System — Project Handbook

## 1. EXECUTIVE SUMMARY
The Product & Buyer Management System (PBMS) is a full-stack web application designed to manage chemical products, buyer and supplier companies, and the contacts associated with them. The system solves the business problem of fragmented data by providing a centralized, secure, and searchable repository. The application is built using React 19 (frontend) and Express.js + Prisma (backend) and features granular role-based access control.

## 2. SYSTEM ARCHITECTURE
PBMS uses a monorepo structure containing both client and server applications.
- **Frontend**: React 19 single-page application built with Vite. Utilizes Ant Design for UI components, React Query for data fetching, and Zustand for state management.
- **Backend**: Express.js REST API using Prisma ORM to connect to a MySQL database.
- **Security**: Authentication is managed via JWT tokens and httpOnly cookies for refresh tokens. Authorization uses a granular, user-level permission model.

## 3. TECHNOLOGY STACK
- **React 19 / Vite**: Chosen for modern, fast frontend development.
- **Ant Design 5**: Provides a comprehensive and professional component library.
- **Zustand**: A small, fast state-management solution used for Auth and Permissions.
- **React Query v5**: Handles server state, caching, and background synchronization.
- **Express.js**: Lightweight Node.js web framework.
- **Prisma**: Type-safe ORM that makes database queries intuitive.
- **MySQL**: Relational database for robust data integrity.
- **Zod**: Schema declaration and validation library.

## 4. DATABASE DESIGN
The system includes over 18 relational models.
- **User & Roles**: Users belong to Departments and are assigned Roles.
- **Product & Company**: Products belong to Categories and Grades. Companies have Branches and Contacts.
- **Mappings**: ProductCompanyMapping tracks which company acts as a supplier or buyer for a specific product.
- **Soft Delete Strategy**: Almost all entities use an 'ACTIVE'/'INACTIVE' status flag rather than being physically deleted from the database.

## 5. API REFERENCE
All APIs are mounted under `/api/v1`.
- **Auth**: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- **Core Modules**: `/products`, `/companies`, `/contacts`, `/mappings` (Standard CRUD endpoints for each)
- **Users**: `/users`, `/users/:id/permissions`, `/profile`
- **Masters**: `/categories`, `/grades`, `/packaging`, `/departments`, `/locations/...`

## 6. FRONTEND GUIDE
- **Routing**: Handled by React Router in `App.jsx` with protected routes wrapper.
- **Components**: Reusable UI elements like `PermissionGuard`, `ColumnSelector`, `BulkImportModal`.
- **API Hooks**: Encapsulated Axios calls in `client/src/api/` using React Query.

## 7. BACKEND GUIDE
- **Middleware**: Includes error handling, token verification, and permission guards.
- **Architecture**: Separates HTTP transport (Controllers) from business logic (Services).
- **Files**: Uploads are handled by Multer and stored locally in `server/uploads/`.

## 8. MODULE DOCUMENTATION
- **Products**: Manages chemical inventory with properties like SKU, CAS number, and Composition.
- **Companies**: Manages business entities and their physical branch locations.
- **Contacts**: Tracks individuals and their specific product interests.
- **Mappings**: The core relational feature connecting Products and Companies by Role Type.
- **Dashboard**: Provides analytical KPIs, Recharts-based visualizations, and activity logs.

## 9. AUTHENTICATION & AUTHORIZATION
- Users log in with email/password and receive a short-lived access token and a long-lived refresh token in an httpOnly cookie.
- Permissions are defined at the user level per module (can_view, can_create, can_edit, can_delete). Super Admins bypass checks.

## 10. FEATURES INVENTORY
- CSV Bulk Import and Export
- Document Uploads (PDF support)
- Granular Column Visibility Selector
- Detailed View Drawers for all entities
- Cascading Location dropdowns (Country -> State -> City)
- Audit Logging for all mutating actions

## 11. DEVELOPMENT GUIDE
- Use `.env.development` for local configuration.
- Avoid modifying `schema.prisma` without running `npx prisma migrate dev`.
- Never use physical DELETE queries; always update the status to 'INACTIVE'.

## 12. DEPLOYMENT GUIDE
- Build frontend with `npm run build`.
- Set `NODE_ENV=production` and use `.env.production`.
- Run migrations with `npx prisma migrate deploy`.

## 13. PROJECT HISTORY
- Phase 1: Init, Schema, Seed
- Phase 2-4: Core backend and frontend modules
- Phase 5-6: Dashboard and Permissions
- Phase 8-10: Advanced features (Documents, CSV, View Drawers, Charts, Locations)
- Phase 11: Final QA, Bug Fixes, Documentation

## 14. APPENDICES
See the `docs/` directory for detailed architecture, schema, and API references.
