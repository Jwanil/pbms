# Product & Buyer Management System (PBMS) — Project Handbook

> **Last updated:** June 2026 | **Version:** 1.0 | **Author:** DEV ITPL

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Database Design](#5-database-design)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Backend Guide](#8-backend-guide)
9. [Frontend Guide](#9-frontend-guide)
10. [Module Documentation](#10-module-documentation)
11. [Features Inventory](#11-features-inventory)
12. [Development Guide](#12-development-guide)
13. [Deployment Guide](#13-deployment-guide)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### What is PBMS?

The **Product & Buyer Management System (PBMS)** is a full-stack internal admin panel built for chemical industry operations. It provides a centralized, structured, and permission-controlled platform for managing:

- **Chemical Products** — with technical properties (CAS number, molecular formula, purity, etc.)
- **Companies** — manufacturers, suppliers, buyers, and distributors with multi-branch support
- **Contacts** — individuals linked to companies, with tracked product interests
- **Product-Company Mappings** — the core relational data linking products to their market participants
- **Users & Permissions** — granular, per-user access control across all modules

### Business Problem Solved

Before PBMS, product and buyer data was siloed across spreadsheets and manual records. PBMS provides:

- A **single source of truth** for product master data
- **Auditable** create/update/delete history for every record
- **Role-gated access** ensuring staff can only act within their assigned scope
- **Search and filter** capabilities across products, companies, and their relationships

### Target Users

| Role | Description |
|------|-------------|
| **Super Admin** | Full system access. Manages users, permissions, and all master data including Locations. |
| **Admin** | Operational access. Can create and edit core data; cannot delete or manage users. |
| **Staff** | Read-only or limited access based on permissions granted by Super Admin. |

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                       │
│          React 19 + Vite + Ant Design 5                  │
│          Zustand (state) + React Query v5 (data)         │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (Axios) — Bearer JWT
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  EXPRESS.JS SERVER (port 5001)           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Middleware: helmet, cors, morgan, cookieParser    │   │
│  │ Auth: verifyToken → roleGuard                    │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routes (/api/v1/*)                              │   │
│  │    └─ Controllers (req/res handling)             │   │
│  │         └─ Services (business logic)             │   │
│  │              └─ Prisma Client (ORM)              │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │            MySQL Database                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. **Client** — Axios sends `Authorization: Bearer <access_token>` with every API request
2. **CORS** — Express CORS validates the request origin against `CLIENT_URL` env var
3. **verifyToken** — Decodes and verifies the JWT. Injects `req.user = { user_id, email, role_id }`
4. **roleGuard(module, action)** — Queries the `Permission` table. Returns `403` if the user lacks the flag
5. **Controller** — Parses `req.body` / `req.params` / `req.query`, calls the appropriate Service
6. **Service** — Executes Prisma queries, applies business rules, throws structured errors on failure
7. **Response** — `sendSuccess()` or `sendPaginated()` wraps data in the standard JSON envelope
8. **errorHandler** — Any unhandled thrown error is caught and formatted as `{ success: false, message, code }`

---

## 3. Technology Stack

### Frontend

| Technology | Version | Why |
|------------|---------|-----|
| React | 19.x | Modern concurrent features, component model |
| Vite | 6.x | Fast HMR, ESM-native dev server |
| Ant Design | 5.x | Comprehensive enterprise UI component library |
| React Query | v5 | Server state management, caching, background sync |
| Zustand | 5.x | Minimal, boilerplate-free global state (auth + permissions) |
| Axios | 1.x | HTTP client with interceptors for token refresh |
| Recharts | 3.x | Composable charting for dashboard analytics |
| PapaParse | 5.x | Client-side CSV parsing for bulk import |
| React Router | v7 | Client-side routing with nested routes |

### Backend

| Technology | Version | Why |
|------------|---------|-----|
| Node.js | 20.x | JavaScript runtime |
| Express.js | 4.x | Minimal, unopinionated web framework |
| Prisma | 6.x | Type-safe ORM with migrations, auto-generated client |
| MySQL | 8.x | Relational DB for data integrity and complex joins |
| bcrypt | 5.x | Password hashing with configurable salt rounds |
| jsonwebtoken | 9.x | JWT generation and verification |
| Zod | 3.x | Schema-based request body validation |
| multer | 1.x | Multipart form-data handling for file uploads |
| helmet | 8.x | HTTP security headers |
| morgan | 1.x | HTTP request logging |
| cookie-parser | 1.x | Parses `refreshToken` httpOnly cookies |
| nodemon | — | Dev-only: auto-restart on file change |

---

## 4. Repository Structure

```
/                                    ← Monorepo root
├── client/                          ← React 19 frontend
│   ├── src/
│   │   ├── api/                     ← React Query hooks + Axios instance (14 files)
│   │   │   ├── axiosInstance.js     ← Axios config, interceptors, token refresh
│   │   │   ├── authApi.js           ← login, logout, refresh, me hooks
│   │   │   ├── productsApi.js       ← product CRUD + import/export hooks
│   │   │   ├── companiesApi.js      ← company CRUD + import/export hooks
│   │   │   ├── contactsApi.js       ← contact CRUD hooks
│   │   │   ├── mappingsApi.js       ← mapping CRUD hooks
│   │   │   ├── usersApi.js          ← user management hooks
│   │   │   ├── userPermissionsApi.js← user permissions read/write hooks
│   │   │   ├── rolesApi.js          ← roles list hook
│   │   │   ├── mastersApi.js        ← categories, grades, packaging, departments hooks
│   │   │   ├── locationsApi.js      ← countries/states/cities hooks
│   │   │   ├── dashboardApi.js      ← stats + activity hooks
│   │   │   ├── documentsApi.js      ← upload/list/delete document hooks
│   │   │   └── profileApi.js        ← profile read/update/change-password hooks
│   │   ├── components/              ← Shared/reusable UI components (22 files)
│   │   │   ├── AppLayout.jsx        ← Main layout: sidebar, header, permission-filtered menu
│   │   │   ├── ProtectedRoute.jsx   ← Redirects unauthenticated users to /login
│   │   │   ├── PublicRoute.jsx      ← Redirects authenticated users away from /login
│   │   │   ├── PermissionRoute.jsx  ← Route-level permission guard
│   │   │   ├── PermissionGuard.jsx  ← Element-level permission guard (wraps buttons/actions)
│   │   │   ├── DataTable.jsx        ← Reusable Ant Design table wrapper
│   │   │   ├── PageHeader.jsx       ← Consistent page title + action bar
│   │   │   ├── FormModal.jsx        ← Generic modal wrapper for add/edit forms
│   │   │   ├── ViewDrawer.jsx       ← Generic detail drawer wrapper
│   │   │   ├── ProductViewDrawer.jsx← Full product detail drawer
│   │   │   ├── CompanyViewDrawer.jsx← Full company + branch detail drawer
│   │   │   ├── ContactViewDrawer.jsx← Full contact + product interests drawer
│   │   │   ├── MappingViewDrawer.jsx← Full mapping detail drawer
│   │   │   ├── DocumentsPanel.jsx   ← Upload/list/delete documents (used in drawers)
│   │   │   ├── BulkImportModal.jsx  ← CSV upload + validation modal
│   │   │   ├── ExportCsvButton.jsx  ← Triggers CSV export download
│   │   │   ├── ColumnSelector.jsx   ← Toggle column visibility in tables
│   │   │   ├── ConfirmDeactivate.jsx← Confirmation dialog for deactivations
│   │   │   ├── LocationFields.jsx   ← Cascading Country → State → City dropdowns
│   │   │   ├── MasterPage.jsx       ← Generic template for master data pages
│   │   │   ├── StatusBadge.jsx      ← ACTIVE/INACTIVE colored badge
│   │   │   └── UserPermissionsModal.jsx← Permission grid modal for Super Admin
│   │   ├── pages/                   ← Route-level page components
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── dashboard/DashboardPage.jsx
│   │   │   ├── products/ProductsPage.jsx
│   │   │   ├── companies/CompaniesPage.jsx
│   │   │   ├── contacts/ContactsPage.jsx
│   │   │   ├── mapping/MappingPage.jsx
│   │   │   ├── users/UsersPage.jsx
│   │   │   ├── profile/ProfilePage.jsx
│   │   │   ├── locations/LocationsPage.jsx
│   │   │   └── masters/
│   │   │       ├── CategoriesPage.jsx
│   │   │       ├── GradesPage.jsx
│   │   │       ├── PackagingPage.jsx
│   │   │       └── DepartmentsPage.jsx
│   │   ├── store/
│   │   │   └── authStore.js         ← Zustand store: user, token, permissions, can()
│   │   ├── hooks/
│   │   │   ├── useColumnVisibility.js ← Custom hook for persisted column toggle state
│   │   │   └── useFormErrors.js     ← Custom hook for mapping Zod errors to Ant Design fields
│   │   ├── theme/antdTheme.js       ← Ant Design ConfigProvider token overrides
│   │   ├── App.jsx                  ← Router: all routes + auth guards
│   │   └── main.jsx                 ← Entry: QueryClientProvider + BrowserRouter + ConfigProvider
│   └── package.json
│
├── server/                          ← Express.js backend
│   ├── src/
│   │   ├── app.js                   ← Express app setup (middleware, routes, error handler)
│   │   ├── index.js                 ← Server entry point (listen on PORT)
│   │   ├── controllers/             ← HTTP layer: req/res, input parsing, calls service
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── companyController.js
│   │   │   ├── contactController.js
│   │   │   ├── mappingController.js
│   │   │   ├── userController.js
│   │   │   ├── profileController.js
│   │   │   ├── locationController.js
│   │   │   ├── masterController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── documentController.js
│   │   │   └── rolesController.js
│   │   ├── services/                ← Business logic: Prisma queries, rules, transforms
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── companyService.js
│   │   │   ├── contactService.js
│   │   │   ├── mappingService.js
│   │   │   ├── userService.js
│   │   │   ├── locationService.js
│   │   │   ├── masterService.js
│   │   │   ├── dashboardService.js
│   │   │   └── rolesService.js
│   │   ├── routes/v1/               ← Express routers, one file per module
│   │   │   ├── index.js             ← Mounts all routers under /api/v1
│   │   │   ├── auth.js
│   │   │   ├── profile.js
│   │   │   ├── users.js
│   │   │   ├── products.js
│   │   │   ├── companies.js
│   │   │   ├── contacts.js
│   │   │   ├── mappings.js
│   │   │   ├── locations.js
│   │   │   ├── dashboard.js
│   │   │   ├── documents.js
│   │   │   ├── categories.js
│   │   │   ├── grades.js
│   │   │   ├── packaging.js
│   │   │   ├── departments.js
│   │   │   ├── roles.js
│   │   │   └── health.js
│   │   ├── middleware/
│   │   │   ├── verifyToken.js       ← JWT verification, injects req.user
│   │   │   ├── roleGuard.js         ← Permission lookup, rejects with 403
│   │   │   ├── errorHandler.js      ← Global error formatter
│   │   │   ├── rateLimiter.js       ← express-rate-limit on login endpoint
│   │   │   └── uploadCsv.js         ← multer config for CSV imports
│   │   └── utils/
│   │       ├── response.js          ← sendSuccess(), sendPaginated(), sendError()
│   │       ├── auditLog.js          ← createAuditLog() helper
│   │       ├── logger.js            ← winston logger config
│   │       └── swagger.js           ← swagger-jsdoc spec generation
│   ├── prisma/
│   │   ├── schema.prisma            ← Single source of truth for DB schema
│   │   ├── migrations/              ← Auto-generated migration files (never edit manually)
│   │   └── seed.js                  ← Default data: roles, departments, categories, locations, super admin
│   ├── uploads/                     ← Local file storage for uploaded documents
│   └── package.json
│
├── docs/                            ← Project documentation
│   ├── PBMS-Project-Handbook.md     ← This file
│   ├── PBMS-Project-Handbook.docx   ← DOCX version of this handbook
│   ├── api-reference.md             ← Endpoint-by-endpoint API reference
│   ├── architecture.md              ← Architecture overview
│   ├── database-schema.md           ← Full schema documentation
│   ├── setup-guide.md               ← Local dev setup instructions
│   └── permissions-guide.md         ← RBAC system explained
│
├── .gitignore                       ← Ignores .env*, node_modules, uploads, dist, reports
└── README.md                        ← Project overview and quick start
```

---

## 5. Database Design

### Entity Relationship Overview

```
Country ──< State ──< City
                                (used for location dropdowns in Company/Branch forms)

Role ──< User ──< Permission     (per-user, per-module permission flags)
         User ──< AuditLog
         User ──< Document

Department ──< User

Category ──< Product
Grade     ──< Product
Packaging ──< Product
Product ──< CompanyProductMapping >── Company ──< Branch
Product ──< ContactProductInterest >── Contact

Company ──< Contact
Branch  ──< Contact
```

### Model Reference

#### `Role`
| Field | Type | Notes |
|-------|------|-------|
| role_id | Int PK | Auto-increment |
| role_name | Enum | `SUPER_ADMIN`, `ADMIN`, `STAFF` |
| description | String? | Optional description |

Seeded with 3 fixed roles. Not editable at runtime.

---

#### `Permission`
| Field | Type | Notes |
|-------|------|-------|
| permission_id | Int PK | Auto-increment |
| user_id | Int FK | References `User` |
| module_name | String | e.g. `products`, `users`, `locations_countries` |
| can_view | Boolean | Default `false` |
| can_create | Boolean | Default `false` |
| can_edit | Boolean | Default `false` |
| can_delete | Boolean | Default `false` |

Unique constraint on `(user_id, module_name)`. Super Admin is seeded with all permissions = `true`.

---

#### `User`
| Field | Type | Notes |
|-------|------|-------|
| user_id | Int PK | Auto-increment |
| name | String | Full display name |
| email | String unique | Login identifier |
| username | String unique | Alternate login |
| password_hash | String | bcrypt hashed (12 rounds) |
| mobile | String? | Optional |
| role_id | Int FK | References `Role` |
| department_id | Int? FK | References `Department` |
| refresh_token_hash | String? | bcrypt hash of last refresh token; `null` means logged out |
| status | Enum | `ACTIVE` / `INACTIVE` (soft delete) |
| last_login_at | DateTime? | Updated on every login |
| created_at | DateTime | Auto |

---

#### `Product`
| Field | Type | Notes |
|-------|------|-------|
| product_id | Int PK | |
| product_name | String | Not unique — SKU/CAS enforces uniqueness |
| sku | String unique | Required |
| cas_number | String? unique | Chemical Abstracts Service number |
| composition | String? | Chemical composition string |
| category_id | Int? FK | References `Category` |
| grade_id | Int? FK | References `Grade` |
| packaging_id | Int? FK | References `Packaging` |
| unit_of_measure | Enum? | `KG`, `LITRE`, `TON` |
| molecular_formula | String? | e.g. H2O |
| molecular_weight | Decimal? | Decimal(10,4) |
| purity | Decimal? | Decimal(5,2) |
| shelf_life | String? | e.g. "24 months" |
| process_type | String? | Manufacturing process |
| un_number | String? | UN hazard classification |
| industry_application | Text? | Long-form application description |
| hsn_code | String? | Harmonized System Nomenclature |
| description | Text? | Full-text indexed description |
| status | Enum | `ACTIVE` / `INACTIVE` |
| created_by | Int? FK | User who created |
| updated_by | Int? FK | User who last updated |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto-updated |

Indexed on: `product_name`, `category_id`, `grade_id`, `status`. Full-text index on `description`.

---

#### `Company`
| Field | Type | Notes |
|-------|------|-------|
| company_id | Int PK | |
| company_name | String | Full-text indexed |
| company_type | Enum | `MANUFACTURER`, `SUPPLIER`, `BUYER`, `DISTRIBUTOR` |
| address | String? | |
| city, state, country | String? | Stored as strings (display-only; `LocationFields` populates them) |
| email, phone | String? | |
| gst_number, pan_number, cin_number | String? | Compliance fields |
| website, industry_type | String? | |
| remarks | Text? | Free-form notes |
| status | Enum | `ACTIVE` / `INACTIVE` |
| created_by | Int? FK | |
| created_at, updated_at | DateTime | |

---

#### `Branch`
| Field | Type | Notes |
|-------|------|-------|
| branch_id | Int PK | |
| company_id | Int FK | Parent company |
| branch_name | String | |
| gst_number, pan_number | String? | Branch-level compliance |
| address_line1, address_line2 | String? | |
| city, state, pincode, country | String? | |
| contact_number, email | String? | |
| latitude, longitude | Decimal? | GPS coordinates |

---

#### `Contact`
| Field | Type | Notes |
|-------|------|-------|
| contact_id | Int PK | |
| first_name | String | |
| last_name | String? | |
| mobile | String | Indexed |
| alternate_mobile, email | String? | |
| company_id | Int? FK | |
| branch_id | Int? FK | |
| contact_type | Enum? | `BUYER`, `PURCHASE_MANAGER`, `SALES`, `ADMIN` |
| designation | String? | |
| preferred_language | Enum? | `ENGLISH`, `HINDI`, `REGIONAL` |
| tags | Text? | Comma-separated tags |
| status | Enum | `ACTIVE` / `INACTIVE` |

---

#### `CompanyProductMapping`
| Field | Type | Notes |
|-------|------|-------|
| mapping_id | Int PK | |
| company_id | Int FK | |
| product_id | Int FK | |
| role_type | Enum | `MANUFACTURER`, `SUPPLIER`, `DISTRIBUTOR` |
| moq | Decimal? | Minimum order quantity |
| price_range_min, price_range_max | Decimal? | Indicative pricing |
| lead_time_days | Int? | |
| is_active | Boolean | Default `true` — soft delete flag |

Unique constraint on `(company_id, product_id, role_type)` — prevents duplicate mappings.

---

#### `ContactProductInterest`
| Field | Type | Notes |
|-------|------|-------|
| id | Int PK | |
| contact_id | Int FK | Cascade delete with Contact |
| product_id | Int FK | |
| created_at | DateTime | |

Unique on `(contact_id, product_id)`.

---

#### `AuditLog`
| Field | Type | Notes |
|-------|------|-------|
| log_id | Int PK | |
| user_id | Int FK | Who performed the action |
| module_name | String | e.g. `products` |
| action_type | Enum | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT` |
| record_id | Int? | ID of the affected record |
| old_values | Text? | JSON snapshot of pre-change state |
| new_values | Text? | JSON snapshot of post-change state |
| ip_address | String? | |
| user_agent | String? | |
| created_at | DateTime | |

---

#### `Document`
| Field | Type | Notes |
|-------|------|-------|
| document_id | Int PK | |
| entity_type | String | `COMPANY` or `PRODUCT` |
| entity_id | Int | ID of the linked entity |
| file_name | String | Original filename |
| file_url | String | Relative path under `uploads/` |
| uploaded_by | Int FK | |
| uploaded_at | DateTime | |

---

#### Location Masters: `Country`, `State`, `City`

- `Country`: `country_id`, `country_name` (unique), `country_code` (3-char), `is_active`
- `State`: `state_id`, `state_name`, `country_id` FK, `is_active`. Unique on `(state_name, country_id)`
- `City`: `city_id`, `city_name`, `state_id` FK, `is_active`. Unique on `(city_name, state_id)`

Deactivating a Country cascades to deactivate its States and Cities.
Deactivating a State cascades to deactivate its Cities.

---

#### Simple Masters: `Category`, `Grade`, `Packaging`, `Department`

All have: PK id, unique name, and a `status` field (ACTIVE/INACTIVE).
`Packaging` additionally has `size_unit` and `size_value` (Decimal(10,2)).

---

### Soft Delete Strategy

| Model | Soft Delete Field |
|-------|------------------|
| User | `status: ACTIVE/INACTIVE` |
| Product | `status: ACTIVE/INACTIVE` |
| Company | `status: ACTIVE/INACTIVE` |
| Contact | `status: ACTIVE/INACTIVE` |
| Category, Grade, Packaging, Department | `status: ACTIVE/INACTIVE` |
| CompanyProductMapping | `is_active: Boolean` |
| Country, State, City | `is_active: Boolean` |

**Rule:** No physical `DELETE` queries anywhere. Deactivation = setting the status/flag.

---

### Seed Data (Default)

After running `npx prisma db seed`:

| Entity | Seeded Count |
|--------|-------------|
| Roles | 3 (SUPER_ADMIN, ADMIN, STAFF) |
| Departments | 5 (Administration, Sales, Procurement, Logistics, Finance) |
| Categories | 8 (Solvents, Polymers, Acids, Alkalis, Intermediates, Specialty Chemicals, Agrochemicals, Surfactants) |
| Grades | 6 (Industrial, Pharma, Food, Technical, Reagent, Laboratory) |
| Packaging | 6 (HDPE Drum 200kg, IBC Tank 1000L, PP Bag 50kg, Carboy 35L, Flexi Bag 1000kg, Glass Bottle 2.5L) |
| Countries | 8 (India, USA, UK, UAE, Germany, Singapore, China, Japan) |
| Indian States | 14 |
| Indian Cities | ~90 |
| Super Admin User | 1 (`admin@pbms.com` / `Admin@123`) |

---

## 6. API Reference

All endpoints are under `http://localhost:5001/api/v1`.

### Standard Response Envelopes

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Paginated list:**
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [], "code": "VALIDATION_ERROR" }
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or malformed Bearer token |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_TOKEN` | 401 | Invalid access token signature |
| `FORBIDDEN` | 403 | User lacks the required permission |
| `ACCOUNT_INACTIVE` | 403 | User account is deactivated |
| `NOT_FOUND` | 404 | Record does not exist |
| `CONFLICT` | 409 | Unique constraint violated (e.g. duplicate SKU) |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `SERVER_ERROR` | 500 | Unhandled internal error |

---

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login with `{ email, password }`. Returns `accessToken`, `user`, `permissions`. Sets `refreshToken` httpOnly cookie. |
| POST | `/auth/refresh` | No (cookie) | Exchanges refresh token cookie for new `accessToken`. |
| POST | `/auth/logout` | Yes | Invalidates refresh token. Clears DB hash. |
| GET | `/auth/me` | Yes | Returns current user's full profile + permissions map. |

**Login request body:**
```json
{ "email": "admin@pbms.com", "password": "Admin@123" }
```

**Login response `data`:**
```json
{
  "accessToken": "eyJ...",
  "user": { "user_id": 1, "name": "Super Admin", "email": "admin@pbms.com", "role": "SUPER_ADMIN", "role_id": 1 },
  "permissions": {
    "products": { "can_view": true, "can_create": true, "can_edit": true, "can_delete": true },
    "companies": { "can_view": true, ... },
    ...
  }
}
```

---

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Yes | Returns logged-in user's full profile |
| PUT | `/profile` | Yes | Update `name` and/or `mobile` |
| PUT | `/profile/change-password` | Yes | Change password using `{ current_password, new_password }` |

---

### Products

Permission module: `products`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/products` | `can_view` | Paginated list. Query: `page`, `limit`, `search`, `category_id`, `grade_id`, `status` |
| GET | `/products/:id` | `can_view` | Full product detail with mappings |
| GET | `/products/form-data` | `can_view` | Returns categories, grades, packaging for dropdowns |
| GET | `/products/export` | `can_view` | Downloads CSV of current product list |
| GET | `/products/sample-csv` | `can_view` | Downloads blank import CSV template |
| POST | `/products` | `can_create` | Create product. Required: `product_name`, `sku` |
| POST | `/products/import` | `can_create` | Bulk import via CSV file (`multipart/form-data`) |
| PUT | `/products/:id` | `can_edit` | Update any product field |
| PATCH | `/products/:id/deactivate` | `can_delete` | Soft delete (status → INACTIVE) |
| PATCH | `/products/:id/reactivate` | `can_edit` | Reactivate (status → ACTIVE) |

**Search** (`/products?search=X`) matches: `product_name`, `sku`, `cas_number`, and names of mapped companies.

---

### Companies

Permission module: `companies`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/companies` | `can_view` | Paginated list. Query: `search`, `company_type`, `status`, `page`, `limit` |
| GET | `/companies/:id` | `can_view` | Full company with branches and contacts |
| GET | `/companies/export` | `can_view` | CSV export |
| GET | `/companies/sample-csv` | `can_view` | Import template |
| POST | `/companies` | `can_create` | Create company. Optional `branches: []` array for multi-branch creation in one request |
| POST | `/companies/import` | `can_create` | Bulk CSV import |
| PUT | `/companies/:id` | `can_edit` | Update company + branches |
| PATCH | `/companies/:id/deactivate` | `can_delete` | Soft delete |
| PATCH | `/companies/:id/reactivate` | `can_edit` | Reactivate |

**Create company body example:**
```json
{
  "company_name": "Chem Corp Ltd",
  "company_type": "SUPPLIER",
  "country": "India",
  "state": "Gujarat",
  "city": "Ahmedabad",
  "branches": [
    { "branch_name": "Ahmedabad HQ", "city": "Ahmedabad", "state": "Gujarat" }
  ]
}
```

---

### Contacts

Permission module: `contacts`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/contacts` | `can_view` | Paginated list. Query: `search`, `contact_type`, `company_id`, `status` |
| GET | `/contacts/:id` | `can_view` | Full contact with product interests |
| GET | `/contacts/export` | `can_view` | CSV export |
| POST | `/contacts` | `can_create` | Create contact. Optional `product_interests: [{ product_id }]` |
| PUT | `/contacts/:id` | `can_edit` | Update contact + product interests (replaces existing) |
| PATCH | `/contacts/:id/deactivate` | `can_delete` | Soft delete |
| PATCH | `/contacts/:id/reactivate` | `can_edit` | Reactivate |

---

### Mappings (Product-Company)

Permission module: `mappings`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/mappings` | `can_view` | Paginated list. Query: `product_id`, `company_id`, `role_type`, `is_active` |
| GET | `/mappings/:id` | `can_view` | Single mapping detail |
| POST | `/mappings` | `can_create` | Create mapping. Prevents duplicate `(company_id, product_id, role_type)` — returns 409 |
| PUT | `/mappings/:id` | `can_edit` | Update mapping fields (role, MOQ, price, lead time) |
| PATCH | `/mappings/:id/deactivate` | `can_delete` | Soft delete (`is_active → false`) |
| PATCH | `/mappings/:id/reactivate` | `can_edit` | Reactivate (`is_active → true`) |

---

### Users

Permission module: `users` (Super Admin only by default)

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/users` | `can_view` | Paginated user list. Query: `search`, `status` |
| GET | `/users/:id` | `can_view` | Single user detail |
| GET | `/users/form-data` | `can_view` | Returns roles + departments for dropdowns |
| POST | `/users` | `can_create` | Create user. Required: `name`, `email`, `username`, `password`, `role_id` |
| PUT | `/users/:id` | `can_edit` | Update user details |
| PATCH | `/users/:id/deactivate` | `can_delete` | Soft delete. Cannot deactivate yourself |
| PATCH | `/users/:id/reactivate` | `can_edit` | Reactivate user |
| GET | `/users/:id/permissions` | `can_view` | Get all module permissions for a user |
| PUT | `/users/:id/permissions` | `can_edit` | Update permissions. Cannot modify another Super Admin's permissions |
| PATCH | `/users/:id/reset-password` | `can_edit` | Admin password reset. Invalidates all sessions |

---

### Locations

GET endpoints are open to all authenticated users (needed for dropdowns).
Write endpoints require specific permissions.

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/locations/countries` | Auth only | All countries (active + inactive for admin UI) |
| POST | `/locations/countries` | `locations_countries.can_create` | Create country |
| PUT | `/locations/countries/:id` | `locations_countries.can_edit` | Update |
| PATCH | `/locations/countries/:id/deactivate` | `locations_countries.can_delete` | Cascades to states and cities |
| PATCH | `/locations/countries/:id/reactivate` | `locations_countries.can_edit` | Reactivate |
| GET | `/locations/states?country_id=X` | Auth only | States filtered by country |
| POST | `/locations/states` | `locations_states.can_create` | Create state under a country |
| PUT | `/locations/states/:id` | `locations_states.can_edit` | Update |
| PATCH | `/locations/states/:id/deactivate` | `locations_states.can_delete` | Cascades to cities |
| PATCH | `/locations/states/:id/reactivate` | `locations_states.can_edit` | Reactivate |
| GET | `/locations/cities?state_id=X` | Auth only | Cities filtered by state |
| POST | `/locations/cities` | `locations_cities.can_create` | Create city under a state |
| PUT | `/locations/cities/:id` | `locations_cities.can_edit` | Update |
| PATCH | `/locations/cities/:id/deactivate` | `locations_cities.can_delete` | Soft delete |
| PATCH | `/locations/cities/:id/reactivate` | `locations_cities.can_edit` | Reactivate |

---

### Dashboard

Permission module: `dashboard`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Returns KPI counts (products, companies, contacts, mappings), `companiesByType` array, `contactsByType` array, `mappingsByRole` array, 6-month `trend` data |
| GET | `/dashboard/activity?limit=20` | Returns recent audit log entries |

---

### Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/documents` | Yes | Upload file (`multipart/form-data`). Fields: `file`, `entity_type` (`COMPANY`/`PRODUCT`), `entity_id` |
| GET | `/documents/:type/:id` | Yes | List documents for entity. e.g. `/documents/product/5` |
| DELETE | `/documents/:id` | Yes | Physically delete file from disk and remove DB record |

Accepted file types: PDF, DOCX. Max file size: 10MB. Files stored in `server/uploads/`.

---

### Masters (Categories, Grades, Packaging, Departments, Roles)

All follow the same pattern:

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/:master` | `can_view` | List all (active + inactive) |
| POST | `/:master` | `can_create` | Create. Required: `name` (or specific field for packaging) |
| PUT | `/:master/:id` | `can_edit` | Update |
| PATCH | `/:master/:id/deactivate` | `can_delete` | Soft delete |
| PATCH | `/:master/:id/reactivate` | `can_edit` | Reactivate |

Masters: `/categories`, `/grades`, `/packaging`, `/departments`. Roles are read-only via `GET /roles`.

---

## 7. Authentication & Authorization

### Login Flow

```
1. POST /auth/login { email, password }
2. Server: find user by email → check ACTIVE status → bcrypt.compare()
3. Fetch all Permission rows for user → build permissionsMap {}
4. generateAccessToken() → JWT signed with JWT_SECRET, expires in 15m
   Payload: { user_id, email, role_id }
5. generateRefreshToken() → JWT signed with JWT_REFRESH_SECRET, expires in 7d
   Payload: { user_id }
6. bcrypt.hash(refreshToken) → store in user.refresh_token_hash
7. Set refreshToken as httpOnly cookie (SameSite=Strict)
8. Return: { accessToken, user, permissions }
```

### Token Refresh Flow

```
1. POST /auth/refresh (no body; reads refreshToken cookie)
2. jwt.verify(refreshToken, JWT_REFRESH_SECRET)
3. Find user by decoded.user_id → check ACTIVE
4. bcrypt.compare(refreshToken, user.refresh_token_hash) → validates session is current
5. Return: { accessToken } (new 15-minute access token)
```

### Logout

```
1. POST /auth/logout (with valid Bearer token)
2. prisma.user.update({ refresh_token_hash: null })
   → Any future refresh attempts will fail at bcrypt.compare()
```

### Frontend Token Refresh (axiosInstance)

The Axios instance in `client/src/api/axiosInstance.js` intercepts 401 responses:
1. Detects `TOKEN_EXPIRED` code
2. Calls `POST /auth/refresh` once
3. Retries the original request with the new token
4. If refresh also fails → calls `clearAuth()` → user is sent to `/login`

### Permission System

**Backend (roleGuard middleware):**
```javascript
// Usage in route files:
router.post('/', verifyToken, roleGuard('products', 'can_create'), createProductController);

// What roleGuard does:
const permission = await prisma.permission.findUnique({
  where: { user_id_module_name: { user_id: req.user.user_id, module_name: 'products' } }
});
if (!permission || !permission.can_create) → 403 FORBIDDEN
```

**Frontend (PermissionGuard component):**
```jsx
// Wraps any UI element — renders children only if user has permission
<PermissionGuard module="products" action="can_create">
  <Button>Add Product</Button>
</PermissionGuard>
```

**Frontend (authStore.can() helper):**
```javascript
// Used in logic where you need to check permission without JSX
const { can } = useAuthStore();
if (can('products', 'can_delete')) { /* show delete button */ }
```

**Sidebar Filtering:**
`AppLayout.jsx` calls `filterMenuItems(menuItems, permissions)` to show only sidebar links for modules where `can_view === true`.

**Super Admin bypass:** The seed ensures the Super Admin user has `can_view, can_create, can_edit, can_delete = true` for ALL modules including `users`, `roles`, and all three location modules.

---

### Permission Modules Reference

| Module Name | What It Controls |
|-------------|-----------------|
| `products` | Product CRUD |
| `companies` | Company + Branch CRUD |
| `contacts` | Contact CRUD |
| `mappings` | Product-Company Mapping CRUD |
| `users` | User management (create/edit/deactivate/permissions) |
| `roles` | View roles list |
| `dashboard` | View dashboard stats and activity |
| `categories` | Category master CRUD |
| `grades` | Grade master CRUD |
| `packaging` | Packaging master CRUD |
| `departments` | Department master CRUD |
| `locations_countries` | Country master management |
| `locations_states` | State master management |
| `locations_cities` | City master management |

---

## 8. Backend Guide

### Middleware Chain (in order)

```
Request
  → helmet()              — sets security HTTP headers
  → cookieParser()        — parses refreshToken cookie
  → cors()                — validates Origin against CLIENT_URL
  → morgan()              — logs HTTP method, path, status, time
  → express.json()        — parses JSON body
  → express.urlencoded()  — parses form body
  → /api/v1 routes
      → verifyToken       — JWT check, populates req.user
      → roleGuard(mod,act)— permission check
      → controller        — extracts params, calls service
      → service           — runs Prisma queries
      → sendSuccess()/sendPaginated() — response
  → errorHandler          — catches all thrown errors, formats JSON
```

### Controller Pattern

Controllers are thin — they only handle HTTP concerns:

```javascript
const getProductsController = async (req, res, next) => {
  try {
    const { page, limit, search, category_id, grade_id, status } = req.query;
    const result = await getProducts({ page: +page, limit: +limit, search, category_id, grade_id, status });
    return sendPaginated(res, result.products, { page: +page, limit: +limit, total: result.total });
  } catch (err) {
    next(err); // passes to errorHandler
  }
};
```

### Service Pattern

Services own all business logic and Prisma queries:

```javascript
// Always use select instead of include
const product = await prisma.product.findUnique({
  where: { product_id: id },
  select: {
    product_id: true, product_name: true,
    category: { select: { category_name: true } },
    // ... all needed fields
  }
});

// Multi-table writes always use $transaction
const [company, branch] = await prisma.$transaction([
  prisma.company.create({ data: companyData }),
  prisma.branch.create({ data: branchData })
]);
```

### Error Handling

All thrown errors with `{ statusCode, message, code }` are caught by `errorHandler.js`:

```javascript
// Throw in service:
throw { statusCode: 409, message: 'A product with this SKU already exists', code: 'CONFLICT' };

// errorHandler formats:
res.status(409).json({ success: false, message: '...', errors: [], code: 'CONFLICT' });
```

### Audit Logging

`server/src/utils/auditLog.js` provides `createAuditLog()`:

```javascript
await createAuditLog({
  userId: req.user.user_id,
  moduleName: 'products',
  actionType: 'CREATE',
  recordId: product.product_id,
  newValues: JSON.stringify(product),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Prisma Rules

1. **NEVER** use `include` and `select` together — use `select` only
2. **NEVER** use `prisma db push` — always run `prisma migrate dev`
3. Multi-table writes → `prisma.$transaction([])`
4. Always filter by `status: 'ACTIVE'` or `is_active: true` in public-facing list queries

---

## 9. Frontend Guide

### Entry Point & Providers

`client/src/main.jsx`:
```jsx
<BrowserRouter>
  <QueryClientProvider client={queryClient}>
    <ConfigProvider theme={antdTheme}>
      <App />
    </ConfigProvider>
  </QueryClientProvider>
</BrowserRouter>
```

### Routing Architecture (`App.jsx`)

```
/login            → PublicRoute → LoginPage (redirects to /dashboard if already logged in)
/                 → ProtectedRoute → AppLayout (redirects to /login if not authenticated)
  /dashboard      → DashboardPage
  /profile        → ProfilePage (no permission guard — all users can access)
  /products       → PermissionRoute(module="products") → ProductsPage
  /companies      → PermissionRoute(module="companies") → CompaniesPage
  /mapping        → PermissionRoute(module="mappings") → MappingPage
  /contacts       → PermissionRoute(module="contacts") → ContactsPage
  /users          → PermissionRoute(module="users") → UsersPage
  /masters/categories   → PermissionRoute(module="categories") → CategoriesPage
  /masters/grades       → PermissionRoute(module="grades") → GradesPage
  /masters/packaging    → PermissionRoute(module="packaging") → PackagingPage
  /masters/departments  → PermissionRoute(module="departments") → DepartmentsPage
  /masters/locations    → PermissionRoute(module="locations_countries") → LocationsPage
* → redirect to /dashboard
```

### State Management (Zustand)

`useAuthStore` holds 4 pieces of state:

```javascript
{
  user: { user_id, name, email, username, role, role_id },
  token: "eyJ...",       // JWT access token
  permissions: {         // keys are module names
    products: { can_view: true, can_create: true, can_edit: true, can_delete: true },
    ...
  },
  isAuthenticated: true
}
```

State is **persisted to `localStorage`** under the key `pbms-auth` via Zustand's `persist` middleware. On page reload, `authApi.useRevalidateSession()` re-validates the session against the server.

The `can(module, action)` helper function:
```javascript
const { can } = useAuthStore();
can('products', 'can_create'); // returns true/false
```

### Data Fetching (React Query v5)

All API calls are in `client/src/api/*.js` as React Query hooks:

```javascript
// Query (read):
export const useProducts = (params) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => axiosInstance.get('/products', { params }).then(r => r.data)
  });

// Mutation (write):
export const useCreateProduct = () =>
  useMutation({
    mutationFn: (data) => axiosInstance.post('/products', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Product created');
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed')
  });
```

> **Note (React Query v5):** `onSuccess`/`onError` are removed from `useQuery`. They are still supported on `useMutation`.

### Shared Components Reference

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Sidebar (permission-filtered menu) + Header (user avatar/logout) + main content area |
| `ProtectedRoute` | Redirects to `/login` if `!isAuthenticated` |
| `PublicRoute` | Redirects to `/dashboard` if `isAuthenticated` |
| `PermissionRoute` | Shows 403 if user lacks `can_view` for the module |
| `PermissionGuard` | Conditionally renders children based on `can(module, action)` |
| `DataTable` | Thin Ant Design `Table` wrapper with consistent styling |
| `PageHeader` | Page title + right-side action buttons slot |
| `FormModal` | Ant Design `Modal` + `Form` wrapper; accepts `open`, `onClose`, `onSubmit`, `loading` |
| `ViewDrawer` | Ant Design `Drawer` wrapper for detail views |
| `ProductViewDrawer` | Shows all product fields + linked mappings + documents tab |
| `CompanyViewDrawer` | Shows company + branches + contacts + documents tab |
| `ContactViewDrawer` | Shows contact + product interests |
| `MappingViewDrawer` | Shows mapping with linked product and company details |
| `DocumentsPanel` | Upload button + documents list with download/delete; used inside view drawers |
| `BulkImportModal` | CSV file picker → PapaParse parsing → row validation → POST to `/import` endpoint |
| `ExportCsvButton` | Button that calls export endpoint and triggers browser download |
| `ColumnSelector` | Popover with checkboxes for each column; state persisted via `useColumnVisibility` hook |
| `ConfirmDeactivate` | Ant Design Popconfirm wrapper for deactivation actions |
| `LocationFields` | Country → State → City cascading `Select` dropdowns; fetches from `/locations/*` |
| `MasterPage` | Generic template that renders a full master data CRUD page with DataTable, search, add/edit/deactivate |
| `StatusBadge` | Green "Active" / Red "Inactive" badge |
| `UserPermissionsModal` | Full grid of all modules × 4 permission flags; used in Users page |

---

## 10. Module Documentation

### Products Module

**Purpose:** Central repository for chemical product master data.

**Database models:** `Product`, `Category`, `Grade`, `Packaging`, `CompanyProductMapping`

**Business rules:**
- `sku` is globally unique — enforced at DB level and in service
- `cas_number` is globally unique when provided
- Products can be searched by their mapped company names (cross-module search)
- Deactivating a product does NOT automatically deactivate its mappings
- Product detail view includes all active mappings (which companies are linked)

**Frontend:**
- `ProductsPage.jsx` — main page with table, search bar, filters (category/grade/status), column selector
- `ProductViewDrawer.jsx` — triggered by eye icon; shows technical details + mappings + documents
- `BulkImportModal` handles CSV import; `ExportCsvButton` handles CSV export

---

### Companies Module

**Purpose:** Manages business entities (manufacturers, suppliers, buyers, distributors) and their physical branches.

**Database models:** `Company`, `Branch`, `Contact`, `CompanyProductMapping`

**Business rules:**
- A company can have multiple branches; branches are created/updated alongside the company
- Company `city`, `state`, `country` fields store display strings (populated by `LocationFields`)
- Searching companies also returns results matched via mapped product names
- Deactivating a company should be reviewed carefully as it may affect active mappings

**Frontend:**
- `CompaniesPage.jsx` — table with type filter, search, and import/export
- `CompanyViewDrawer.jsx` — shows company details, branches tab, contacts tab, documents tab
- `LocationFields.jsx` — used in company and branch add/edit forms for cascading location selection

---

### Contacts Module

**Purpose:** Tracks individuals associated with companies, their role type, and which products they are interested in.

**Database models:** `Contact`, `ContactProductInterest`, `Company`, `Branch`

**Business rules:**
- A contact must have at least a `first_name` and `mobile`
- `ContactProductInterest` records are replaced entirely on update (delete-then-insert pattern)
- Contacts can be optionally linked to a company and/or branch

**Frontend:**
- `ContactsPage.jsx` — table with contact type filter and company filter
- `ContactViewDrawer.jsx` — shows personal details + product interests list

---

### Product-Company Mappings Module

**Purpose:** Defines the commercial relationship between a product and a company — specifically what role (Manufacturer, Supplier, Distributor) the company plays for that product.

**Database models:** `CompanyProductMapping`

**Business rules:**
- The combination `(company_id, product_id, role_type)` must be unique — returns 409 on duplicate
- Additional commercial metadata: MOQ, price range (min/max), lead time in days
- `is_active` is the soft delete flag
- A single product can map to many companies (and vice versa)

**Frontend:**
- `MappingPage.jsx` — table with filters for product, company, role type, and active status
- `MappingViewDrawer.jsx` — shows linked product and company details

---

### Users & Roles Module

**Purpose:** Manages application users and their access permissions.

**Database models:** `User`, `Role`, `Permission`, `Department`

**Business rules:**
- Only Super Admin can access this module (seeded permission restriction)
- Cannot deactivate yourself (self-protection guard in service)
- Cannot modify another Super Admin's permissions (protection against lockout)
- Password reset generates a new random password, invalidates all refresh tokens for that user
- Roles (SUPER_ADMIN, ADMIN, STAFF) define organizational structure but NOT app access — that's done via `Permission` entries

**Frontend:**
- `UsersPage.jsx` — users table with create/edit/deactivate/reset-password actions
- `UserPermissionsModal.jsx` — a grid showing all 14 modules × 4 permission flags as toggles

---

### Dashboard Module

**Purpose:** Provides an analytics overview of the system's core data.

**API response from `/dashboard/stats`:**
```json
{
  "counts": { "products": 120, "companies": 45, "contacts": 230, "mappings": 89 },
  "companiesByType": [{ "company_type": "SUPPLIER", "_count": 20 }, ...],
  "contactsByType": [{ "contact_type": "BUYER", "_count": 150 }, ...],
  "mappingsByRole": [{ "role_type": "MANUFACTURER", "_count": 40 }, ...],
  "trend": [{ "month": "Jan", "products": 5, "companies": 3, "contacts": 12 }, ...]
}
```

**Frontend:**
- `DashboardPage.jsx` — 4 KPI cards + 3 Recharts charts (Pie: companies by type, Bar: contacts by type, Line: 6-month trend) + Recent Activity table

---

### Masters Module

**Purpose:** Provides configurable lookup lists used across the system.

**Categories:** Chemical product categories (Solvents, Polymers, Acids, etc.)
**Grades:** Product quality grades (Industrial, Pharma, Food, etc.)
**Packaging:** Packaging types with size (HDPE Drum 200kg, IBC Tank 1000L, etc.)
**Departments:** Organizational departments for users (Sales, Procurement, etc.)

All masters use the same `MasterPage.jsx` template component with `create/update/deactivate/reactivate` operations. Duplicate names return 409.

---

### Locations Module

**Purpose:** Provides hierarchical location master data (Country → State → City) used in Company and Branch address forms.

**Business rules:**
- Deactivating a Country cascades: all its States and Cities are also set `is_active = false`
- Deactivating a State cascades: all its Cities are set `is_active = false`
- The `LocationFields` component only shows `is_active = true` locations in dropdowns
- GET endpoints for countries/states/cities have no permission guard (needed for dropdown population in Company/Branch forms by all users)
- Write endpoints require `locations_countries`, `locations_states`, or `locations_cities` permissions — only Super Admin has these by default

**Frontend:**
- `LocationsPage.jsx` — tabbed interface with Countries, States, Cities tabs
- `LocationFields.jsx` — cascading dropdown component used in Company and Branch forms

---

### Documents Module

**Purpose:** Attach PDF/DOCX files to Products and Companies.

**Storage:** Files are saved to `server/uploads/` on disk. The `uploads/` directory is served statically via Express at `/uploads/*`.

**Business rules:**
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max file size: 10MB
- Documents are polymorphically linked via `entity_type` + `entity_id`
- DELETE physically removes the file from disk and deletes the DB record

**Frontend:**
- `DocumentsPanel.jsx` — reusable component embedded in Product and Company view drawers

---

## 11. Features Inventory

| Feature | Module | Status |
|---------|--------|--------|
| Login / Logout / Refresh Token | Auth | ✅ |
| Session persistence (localStorage + cookie) | Auth | ✅ |
| Rate limiting on login (1000 req / 15 min) | Auth | ✅ |
| View & update profile | Profile | ✅ |
| Change password | Profile | ✅ |
| Dashboard KPI cards | Dashboard | ✅ |
| Dashboard charts (Pie, Bar, Line) | Dashboard | ✅ |
| Recent activity feed (audit log) | Dashboard | ✅ |
| Product CRUD | Products | ✅ |
| Product search (name, SKU, CAS, mapped company) | Products | ✅ |
| Product filter (category, grade, status) | Products | ✅ |
| Product CSV export | Products | ✅ |
| Product CSV bulk import | Products | ✅ |
| Product CSV import template download | Products | ✅ |
| Product soft deactivate / reactivate | Products | ✅ |
| Company CRUD with multi-branch | Companies | ✅ |
| Company search (name, mapped product) | Companies | ✅ |
| Company CSV export + import | Companies | ✅ |
| Cascading location dropdowns in company/branch forms | Companies | ✅ |
| Contact CRUD with product interests | Contacts | ✅ |
| Contact CSV export | Contacts | ✅ |
| Product-Company Mapping CRUD | Mappings | ✅ |
| Duplicate mapping prevention (409) | Mappings | ✅ |
| Mapping filters (product, company, role, status) | Mappings | ✅ |
| User management (create, edit, deactivate) | Users | ✅ |
| User permission management (modal grid) | Users | ✅ |
| Admin password reset | Users | ✅ |
| Per-user, per-module RBAC | Permissions | ✅ |
| Sidebar permission filtering | Permissions | ✅ |
| Route-level permission guard | Permissions | ✅ |
| Element-level permission guard (buttons) | Permissions | ✅ |
| Categories CRUD | Masters | ✅ |
| Grades CRUD | Masters | ✅ |
| Packaging CRUD | Masters | ✅ |
| Departments CRUD | Masters | ✅ |
| Country / State / City management | Locations | ✅ |
| Cascading deactivation (country → state → city) | Locations | ✅ |
| Document upload (PDF/DOCX) | Documents | ✅ |
| Document list per entity | Documents | ✅ |
| Document download | Documents | ✅ |
| Document delete (physical) | Documents | ✅ |
| View Drawers for all entities | UI/UX | ✅ |
| Column visibility selector (persisted) | UI/UX | ✅ |
| Pagination on all list pages | UI/UX | ✅ |
| Status filter (Active/Inactive) | UI/UX | ✅ |
| Audit logging for all mutations | System | ✅ |
| Swagger UI (`/api/v1/docs`) | System | ✅ |
| Health check endpoint (`/api/v1/health`) | System | ✅ |

---

## 12. Development Guide

### Prerequisites

- Node.js v18 or higher
- MySQL 8.x (local or remote)
- Git

### Local Setup (Step by Step)

**1. Clone and install:**
```bash
git clone https://github.com/Jwanil/pbms.git
cd pbms

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

**2. Create `server/.env.development`:**
```env
PORT=5001
DATABASE_URL="mysql://root:your_password@localhost:3306/pbms_db?socket=/tmp/mysql.sock"
JWT_SECRET="your_super_secret_jwt_key_min_32_chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_refresh_secret_key_min_32_chars"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

> **macOS Note:** MySQL uses Unix socket at `/tmp/mysql.sock`. Include `?socket=/tmp/mysql.sock` in the `DATABASE_URL`.

**3. Create `client/.env.local`:**
```env
VITE_API_URL=http://localhost:5001/api/v1
```

**4. Create the MySQL database:**
```sql
CREATE DATABASE pbms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**5. Run migrations:**
```bash
cd server
export $(cat .env.development | xargs)  # Load env vars first
npx prisma migrate dev --name init
```

**6. Seed default data:**
```bash
npx prisma db seed
```

**7. Start servers:**
```bash
# Terminal 1 — Backend
cd server && npm run dev      # Starts on http://localhost:5001

# Terminal 2 — Frontend
cd client && npm run dev      # Starts on http://localhost:5173
```

**8. Login:**
- URL: `http://localhost:5173`
- Email: `admin@pbms.com`
- Password: `Admin@123`

---

### How to Add a New Module

Follow this pattern for any new entity:

1. **Schema:** Add model to `server/prisma/schema.prisma`
2. **Migrate:** `export $(cat .env.development | xargs) && npx prisma migrate dev --name add_module_name`
3. **Service:** Create `server/src/services/moduleService.js` with CRUD functions
4. **Controller:** Create `server/src/controllers/moduleController.js`
5. **Route:** Create `server/src/routes/v1/module.js` with `verifyToken` + `roleGuard` on each route
6. **Register:** Import and mount in `server/src/routes/v1/index.js`
7. **Permission:** Add `module_name` to the `MODULES` array in `server/prisma/seed.js`
8. **Frontend API hooks:** Create `client/src/api/moduleApi.js`
9. **Frontend page:** Create `client/src/pages/module/ModulePage.jsx`
10. **Frontend route:** Add route in `client/src/App.jsx` wrapped in `PermissionRoute`
11. **Sidebar:** Add menu item in `client/src/components/AppLayout.jsx` and map in `ROUTE_MODULE_MAP`

---

### Coding Conventions

| Rule | Detail |
|------|--------|
| Language | JavaScript only — `.js` and `.jsx`. No TypeScript. |
| Imports (server) | CommonJS `require()` / `module.exports` |
| Imports (client) | ES Modules `import` / `export` |
| Soft deletes | Always update `status` or `is_active`; never use physical DELETE |
| Prisma queries | Always use `select`. Never combine `include` and `select`. |
| Multi-table writes | Always use `prisma.$transaction([...])` |
| Response format | Always use `sendSuccess()`, `sendPaginated()`, `sendError()` from `utils/response.js` |
| Error throwing | `throw { statusCode, message, code }` — caught by `errorHandler` |
| Environment | Secrets go in `.env.development` only — never hardcoded |
| Console logs | Not allowed in production code (only in `seed.js` and server startup) |

---

### Common Pitfalls & Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `prisma migrate dev` fails | Missing env vars | Prefix with `export $(cat .env.development | xargs)` |
| MySQL connection refused | Socket path wrong | Add `?socket=/tmp/mysql.sock` to DATABASE_URL on macOS |
| `401 TOKEN_EXPIRED` on every request | Access token expired, no refresh | Check `axiosInstance.js` interceptor; ensure cookie is set |
| `403 FORBIDDEN` unexpectedly | User lacks permission | Check Permission table rows for that `user_id` + `module_name` |
| `409 CONFLICT` on create | Duplicate unique field | SKU/CAS for products, `(company_id, product_id, role_type)` for mappings |
| Ant Design deprecation warning | Old prop used | `bordered=false` → `variant="borderless"`, `bodyStyle` → `styles={{ body: ... }}` |
| React Query `onSuccess` not called | v5 breaking change | `onSuccess` removed from `useQuery`; use `useEffect` or mutation callbacks |
| Port 5000 in use | macOS Control Center | Use port 5001 in `.env.development` |

---

## 13. Deployment Guide

### Build

```bash
# Frontend
cd client && npm run build        # Outputs to client/dist/

# Backend — no build step needed; runs directly with Node
```

### Production Environment Variables (`server/.env.production`)

```env
PORT=5001
DATABASE_URL="mysql://user:password@prod-host:3306/pbms_prod"
JWT_SECRET="<strong random 64-char secret>"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<different strong 64-char secret>"
JWT_REFRESH_EXPIRES_IN="7d"
CLIENT_URL="https://your-production-domain.com"
NODE_ENV="production"
```

### Production Migration

```bash
cd server
NODE_ENV=production npx prisma migrate deploy
```

> **Never** run `prisma migrate dev` in production — use `migrate deploy`.

### Static Files

Serve `client/dist/` via a web server (Nginx, Caddy) or deploy to a CDN. The Express backend only serves the API (`/api/v1/*`) and uploaded files (`/uploads/*`).

### Recommended Stack

| Layer | Option |
|-------|--------|
| Frontend hosting | Vercel, Netlify, or Nginx static |
| Backend hosting | Railway, Render, VPS (PM2 + Nginx) |
| Database | PlanetScale, Railway MySQL, or self-hosted |
| File storage | Local disk (current) or migrate to S3 + signed URLs |

---

## 14. Appendices

### A. Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `5001` | Server listen port |
| `DATABASE_URL` | Yes | `mysql://...` | Prisma connection string |
| `JWT_SECRET` | Yes | 64-char random | Signs access tokens |
| `JWT_EXPIRES_IN` | Yes | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | Yes | 64-char random | Signs refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Yes | `7d` | Refresh token TTL |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | Yes | `development` | Controls morgan log format |

### B. Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@pbms.com` |
| Password | `Admin@123` |
| Role | SUPER_ADMIN |

> Change this password immediately after first login in any shared environment.

### C. Swagger API Docs

The backend auto-generates Swagger UI from JSDoc comments in route files.

URL: `http://localhost:5001/api/v1/docs`

### D. Key File Quick Reference

| File | Purpose |
|------|---------|
| `server/prisma/schema.prisma` | DB schema — only edit this, then migrate |
| `server/prisma/seed.js` | Default data — roles, departments, masters, super admin |
| `server/src/app.js` | Express setup — middleware order matters |
| `server/src/middleware/verifyToken.js` | JWT verification |
| `server/src/middleware/roleGuard.js` | Permission enforcement |
| `server/src/utils/response.js` | Standard response helpers |
| `client/src/api/axiosInstance.js` | Token refresh interceptor |
| `client/src/store/authStore.js` | Global auth state + `can()` helper |
| `client/src/App.jsx` | All frontend routes |
| `client/src/components/AppLayout.jsx` | Sidebar + header + content layout |
