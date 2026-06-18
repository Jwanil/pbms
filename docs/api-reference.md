# API Reference

## Auth Module

### `POST /api/v1/auth/login`
- **Auth:** Not required
- **Body:** `{ email, password }`
- **Response:** `{ success, message, data: { token, user, permissions } }`

### `POST /api/v1/auth/refresh`
- **Auth:** Not required (uses httpOnly cookie `refreshToken`)
- **Response:** `{ success, message, data: { accessToken } }`

### `POST /api/v1/auth/logout`
- **Auth:** Required
- **Response:** `{ success, message }`

### `GET /api/v1/auth/me`
- **Auth:** Required
- **Response:** `{ success, message, data: { user, permissions } }`

## Profile Module

### `GET /api/v1/profile`
- **Auth:** Required
- **Response:** `{ success, message, data: { ...user profile } }`

### `PUT /api/v1/profile`
- **Auth:** Required
- **Body:** `{ name, mobile }`
- **Response:** `{ success, message, data }`

### `PUT /api/v1/profile/change-password`
- **Auth:** Required
- **Body:** `{ current_password, new_password }`
- **Response:** `{ success, message }`

## Users & Roles Module

### `GET /api/v1/users`
- **Auth:** Required
- **Permission:** `users.can_view`
- **Query Params:** `page`, `limit`, `search`, `status`
- **Response:** `{ success, data: [], pagination: {} }`

### `POST /api/v1/users`
- **Auth:** Required
- **Permission:** `users.can_create`
- **Body:** `{ name, email, username, password, mobile, role_id, department_id }`
- **Response:** `{ success, message, data }`

### `PUT /api/v1/users/:id`
- **Auth:** Required
- **Permission:** `users.can_edit`
- **Response:** `{ success, message, data }`

### `PATCH /api/v1/users/:id/deactivate`
- **Auth:** Required
- **Permission:** `users.can_delete`
- **Response:** `{ success, message }`

### `PATCH /api/v1/users/:id/reactivate`
- **Auth:** Required
- **Permission:** `users.can_edit`
- **Response:** `{ success, message }`

### `GET /api/v1/users/:id/permissions`
- **Auth:** Required
- **Permission:** `users.can_view`
- **Response:** `{ success, data: [] }`

### `PUT /api/v1/users/:id/permissions`
- **Auth:** Required
- **Permission:** `users.can_edit`
- **Body:** `{ permissions: [{ module_name, can_view, can_create, can_edit, can_delete }] }`
- **Response:** `{ success, message }`

### `PATCH /api/v1/users/:id/reset-password`
- **Auth:** Required
- **Permission:** `users.can_edit`
- **Response:** `{ success, message }`

## Core Modules (Products, Companies, Contacts, Mappings)

All core modules follow standard CRUD pattern under their respective routes (`/api/v1/products`, `/api/v1/companies`, `/api/v1/contacts`, `/api/v1/mappings`).

### `GET /api/v1/[module]`
- **Auth:** Required
- **Permission:** `[module].can_view`
- **Query:** `page`, `limit`, `search`, etc.
- **Response:** `{ success, data: [], pagination }`

### `POST /api/v1/[module]`
- **Auth:** Required
- **Permission:** `[module].can_create`
- **Body:** Standard body for entity creation.
- **Response:** `{ success, message, data }`

### `PUT /api/v1/[module]/:id`
- **Auth:** Required
- **Permission:** `[module].can_edit`
- **Response:** `{ success, message, data }`

### `PATCH /api/v1/[module]/:id/deactivate`
- **Auth:** Required
- **Permission:** `[module].can_delete`
- **Response:** `{ success, message }`

### `PATCH /api/v1/[module]/:id/reactivate`
- **Auth:** Required
- **Permission:** `[module].can_edit`
- **Response:** `{ success, message }`

## Locations Module

### `GET /api/v1/locations/countries`
- **Auth:** Required
- **Response:** `{ success, data: [] }`

### `GET /api/v1/locations/states?country_id=X`
- **Auth:** Required
- **Response:** `{ success, data: [] }`

### `GET /api/v1/locations/cities?state_id=X`
- **Auth:** Required
- **Response:** `{ success, data: [] }`

(All Locations also support standard POST/PUT/PATCH for management under `locations_countries`, `locations_states`, `locations_cities` permissions).

## Dashboard Module

### `GET /api/v1/dashboard/stats`
- **Auth:** Required
- **Permission:** `dashboard.can_view`
- **Response:** `{ success, data: { counts, charts, trend } }`

### `GET /api/v1/dashboard/activity`
- **Auth:** Required
- **Permission:** `dashboard.can_view`
- **Response:** `{ success, data: [] }`

## Documents Module

### `POST /api/v1/documents/upload`
- **Auth:** Required
- **Body (FormData):** `file`, `entity_type`, `entity_id`
- **Response:** `{ success, message, data }`

### `GET /api/v1/documents/:entityType/:entityId`
- **Auth:** Required
- **Response:** `{ success, data: [] }`

### `DELETE /api/v1/documents/:id`
- **Auth:** Required
- **Response:** `{ success, message }`
