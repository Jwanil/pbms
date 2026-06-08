# Architecture & Developer Guide

This document outlines the conventions, architecture, and structural decisions of the Product & Buyer Management System (PBMS).

## 1. High-Level Architecture

PBMS uses a standard 3-layer architecture inside a monorepo:

1. **Frontend (Presentation Layer):** React 19 + Vite, Ant Design (v5), React Router v7. State is managed locally by Zustand and remotely via TanStack Query (React Query v5).
2. **Backend (API Layer):** Node.js + Express.js. RESTful APIs serving JSON.
3. **Database (Data Layer):** MySQL 8.x managed by Prisma ORM (v6.x).

All code is written in **JavaScript** (`.js`, `.jsx`). TypeScript is strictly prohibited by project convention.

---

## 2. Backend Conventions

### Controller-Service-Prisma Pattern
- **Routes (`src/routes/v1/`)**: Define HTTP verbs, paths, and attach middleware (`verifyToken`, `roleGuard`).
- **Controllers (`src/controllers/`)**: Extract request data, perform Zod validation, call services, and return standardized HTTP responses using `sendSuccess` or `sendError`.
- **Services (`src/services/`)**: (Optional for simple CRUD) Handle complex business logic (e.g., transaction management).
- **Prisma:** Direct DB interaction.

### Request Validation
We use **Zod (v3)** for runtime validation inside controllers.
- Use `parsed.error.issues` (not `.errors`) to map Zod errors into our standard response format.
- Mapped errors look like: `[{ field: 'email', message: 'Invalid format' }]`.

### Transactions
Any operation touching more than one table must use `prisma.$transaction`.
*Example: Creating a company with branches, or updating a user and their permissions.*

### Soft Deletes
Physical `DELETE` queries are forbidden.
- We use a `status` Enum (`ACTIVE` / `INACTIVE`) for primary entities.
- We use an `is_active` Boolean for mappings.
- Soft-deleting a parent (e.g., Company) cascadingly soft-deletes its children (Branches, Mappings, Contacts).

### Audit Logging
The `writeAuditLog` utility is called after every `CREATE`, `UPDATE`, and `DELETE` (Deactivate).
It routines stores the user ID, action, module, record ID, and stringified `old_values`/`new_values`.

---

## 3. Frontend Conventions

### State Management
- **TanStack Query (React Query v5):** Used for all server state (fetching lists, mutations). Note: `onSuccess`/`onError` are deprecated for `useQuery` in v5, so we use `useEffect` watching `data`/`error` instead. Mutations still support them.
- **Zustand:** Used for global client state, specifically authentication (`useAuthStore`). It stores the user object, JWT token, and the 11-module permission matrix.

### UI Library: Ant Design (v5)
- All forms use `<Form>` and `<Form.Item>` with AntD's built-in validation rules.
- The `useFormErrors` custom hook bridges backend Zod errors directly into AntD form field errors.
- Tables use `<Table>` with server-side pagination and sorting. Do not use `fixed: 'right'` on action columns due to layout bugs.

### Core Reusable Components
- **`PageHeader`**: Standardized title, breadcrumbs, and primary action buttons.
- **`FormModal`**: Standardized modal wrapper for CRUD forms.
- **`StatusBadge`**: Renders `ACTIVE`/`INACTIVE` consistently.
- **`MasterPage`**: A higher-order component that generates full CRUD pages for simple master data (Categories, Grades, etc.).

---

## 4. Security & Permissions System

PBMS uses **User-Based Access Control (UBAC)**. While users belong to a "Role" (SUPER_ADMIN, ADMIN, STAFF), these roles are purely for labeling and seeding templates. Actual permissions are stored per-user.

### The Permission Matrix
The `Permission` table holds 11 rows per user, one for each module. Each row has 4 flags:
- `can_view`
- `can_create`
- `can_edit`
- `can_delete`

### Backend Enforcement
The `roleGuard(moduleName, action)` middleware queries the `Permission` table using `req.user.user_id` (extracted from the JWT). If the requested flag is false, it returns `403 Forbidden`.

### Frontend Enforcement
1. **Sidebar Navigation:** `AppLayout.jsx` filters the menu items. If `can_view` is false, the module disappears from the sidebar.
2. **Page Access:** `<PermissionRoute module="xyz">` wraps every route in `App.jsx`. It redirects unauthorized access to `/unauthorized`.
3. **Action Buttons:** `<PermissionGuard module="xyz" action="can_edit">` wraps Edit/Delete/Create buttons inside pages. If the user lacks the permission, the button is not rendered.

### Super Admin Protection
The `SUPER_ADMIN` role (role_id: 1) has special protections:
- Their permissions cannot be edited by anyone (backend throws 403).
- They cannot deactivate their own account.

---

## 5. Development Workflow

1. **Environment Variables:** Must use `.env.development` locally. Never commit this file.
2. **Database Changes:** 
   - Modify `prisma/schema.prisma`.
   - Run `npx prisma migrate dev --name <migration_name>`.
   - Update `seed.js` if necessary.
   - Run `npx prisma db seed`.
3. **No TypeScript:** If a `.ts` or `.tsx` file is created, it violates project rules.
4. **Git Commits:** All commits should be small, logical, and accompanied by a detailed message.