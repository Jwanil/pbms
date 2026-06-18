# System Architecture

## Monorepo Structure

PBMS is structured as a monorepo containing both the frontend client and backend server.

```
/client       -> React 19 + Vite + Ant Design
/server       -> Express.js + Prisma + MySQL
```

## Frontend Architecture

- **Framework:** React 19 via Vite
- **Styling/Components:** Ant Design 5 (customized theme)
- **State Management:** Zustand (for global Auth/Permissions state)
- **Data Fetching:** React Query v5 + Axios
- **Routing:** React Router v7
- **UI Logic:** Component-based architecture with `pages/` for route-level containers and `components/` for shared UI (e.g. `BulkImportModal`, `PermissionGuard`).

## Backend Architecture

- **Framework:** Express.js on Node.js
- **Database ORM:** Prisma Client 6.x
- **Database:** MySQL
- **Pattern:** Routes -> Controllers -> Services -> Database
- **Validation:** Zod schemas
- **Authentication:** JWT (JSON Web Tokens) with short-lived Access Tokens and long-lived, db-validated Refresh Tokens stored in httpOnly cookies.
- **Authorization:** Granular user-level RBAC (Role-Based Access Control) enforced by `verifyToken` and `roleGuard` middleware.

## Request Lifecycle

1. **Client Request:** Frontend Axios instance sends an HTTP request with Authorization header (Access Token).
2. **Route definition:** Express router captures the request.
3. **Middleware:** 
   - `verifyToken` validates the JWT and injects `req.user`.
   - `roleGuard(module, action)` validates if `req.user` has the required permissions for the action on the given module.
4. **Controller:** Extracts req.body, req.params, validates them, and calls the appropriate Service function.
5. **Service:** Implements business logic and Prisma queries.
6. **Response Formatter:** Service returns data, Controller wraps it in the standard `{ success, message, data }` format.
7. **Error Handler:** Any thrown error is caught by `asyncHandler` and sent to `errorHandler` middleware to format the error response uniformly.