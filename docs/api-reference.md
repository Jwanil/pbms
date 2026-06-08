# REST API Reference

This document provides a comprehensive reference for the PBMS REST API. All endpoints are prefixed with `/api/v1`.

## Standard Response Formats

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Paginated Success Response (200):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `INVALID_TOKEN` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `SELF_DEACTIVATION` (400)

---

## Auth Endpoints (`/auth`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/auth/login` | Authenticate user with email and password | No |
| `POST` | `/auth/logout` | Invalidate refresh token and clear cookie | Yes |
| `POST` | `/auth/refresh` | Obtain new access token via HttpOnly refresh cookie | No |
| `GET` | `/auth/me` | Retrieve authenticated user profile and permissions | Yes |

---

## Dashboard (`/dashboard`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/dashboard/stats` | Retrieve KPI counts, charts, and activity feed | Logged in |

---

## Products (`/products`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/products` | List paginated products | `products.can_view` |
| `GET` | `/products/:id` | Get specific product details | `products.can_view` |
| `GET` | `/products/form-data` | Dropdown data for creation | `products.can_view` |
| `POST` | `/products` | Create a new product | `products.can_create` |
| `PUT` | `/products/:id` | Update product details | `products.can_edit` |
| `PATCH` | `/products/:id/deactivate` | Soft delete product | `products.can_delete` |
| `PATCH` | `/products/:id/reactivate` | Restore product | `products.can_edit` |

---

## Companies (`/companies`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/companies` | List paginated companies | `companies.can_view` |
| `GET` | `/companies/:id` | Get company and its branches | `companies.can_view` |
| `POST` | `/companies` | Create company (with branches) | `companies.can_create` |
| `PUT` | `/companies/:id` | Update company & sync branches | `companies.can_edit` |
| `PATCH` | `/companies/:id/deactivate` | Soft delete company | `companies.can_delete` |
| `PATCH` | `/companies/:id/reactivate` | Restore company | `companies.can_edit` |

---

## Contacts (`/contacts`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/contacts` | List paginated contacts | `contacts.can_view` |
| `GET` | `/contacts/:id` | Get contact and product interests | `contacts.can_view` |
| `GET` | `/contacts/form-data` | Dropdown data for creation | `contacts.can_view` |
| `POST` | `/contacts` | Create contact with interests | `contacts.can_create` |
| `PUT` | `/contacts/:id` | Update contact & sync interests | `contacts.can_edit` |
| `PATCH` | `/contacts/:id/deactivate` | Soft delete contact | `contacts.can_delete` |
| `PATCH` | `/contacts/:id/reactivate` | Restore contact | `contacts.can_edit` |

---

## Mappings (`/mappings`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/mappings` | List paginated mappings | `mappings.can_view` |
| `GET` | `/mappings/form-data` | Dropdown data for creation | `mappings.can_view` |
| `POST` | `/mappings` | Create mapping | `mappings.can_create` |
| `PUT` | `/mappings/:id` | Update mapping | `mappings.can_edit` |
| `PATCH` | `/mappings/:id/deactivate` | Soft delete mapping | `mappings.can_delete` |
| `PATCH` | `/mappings/:id/reactivate` | Restore mapping | `mappings.can_edit` |

---

## Users & Permissions (`/users`)

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/users` | List paginated users | `users.can_view` |
| `GET` | `/users/:id` | Get user by ID | `users.can_view` |
| `GET` | `/users/form-data` | Dropdown data for creation | `users.can_view` |
| `POST` | `/users` | Create user and auto-seed permissions | `users.can_create` |
| `PUT` | `/users/:id` | Update user profile | `users.can_edit` |
| `PATCH` | `/users/:id/deactivate` | Soft delete user | `users.can_delete` |
| `PATCH` | `/users/:id/reactivate` | Restore user | `users.can_edit` |
| `GET` | `/users/:id/permissions` | Retrieve 11 UBAC permission rows | `users.can_view` |
| `PUT` | `/users/:id/permissions` | Batch update UBAC permissions | `users.can_edit` |

---

## Master Data

All master data modules share identical CRUD patterns. Replace `{master}` with `categories`, `grades`, `packaging`, or `departments`.

> **Note:** The `packaging` module includes extra fields `size_unit` and `size_value`.

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| `GET` | `/{master}` | List items with search/pagination | `{master}.can_view` |
| `POST` | `/{master}` | Create new item | `{master}.can_create` |
| `PUT` | `/{master}/:id` | Update item | `{master}.can_edit` |
| `PATCH` | `/{master}/:id/deactivate` | Soft delete item | `{master}.can_delete` |
| `PATCH` | `/{master}/:id/reactivate` | Restore item | `{master}.can_edit` |

---

## Utility

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/health` | API Health check | No |