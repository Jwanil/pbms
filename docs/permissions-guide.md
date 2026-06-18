# Permissions & Role-Based Access Control (RBAC)

PBMS uses a granular, user-level permission system rather than strict role-based gating. Roles exist (e.g. SUPER_ADMIN, ADMIN, STAFF) to define organizational structure, but application access is dictated by individual permissions assigned to users.

## How It Works

Each user has multiple entries in the `Permission` table, corresponding to different modules. 
A permission entry defines 4 flags:
- `can_view`: Allows read operations (GET lists, GET by id). Controls sidebar visibility.
- `can_create`: Allows create operations (POST). Shows "Add" buttons.
- `can_edit`: Allows update operations (PUT/PATCH). Shows "Edit" buttons.
- `can_delete`: Allows delete/deactivate operations (PATCH status to INACTIVE). Shows "Delete/Deactivate" buttons.

## Protected Modules
- `products`
- `companies`
- `contacts`
- `mappings`
- `users`
- `roles`
- `dashboard`
- `categories`, `grades`, `packaging`, `departments`
- `locations_countries`, `locations_states`, `locations_cities`

## Enforcing Permissions

### Backend Middleware (`roleGuard`)
Routes are protected by applying the `roleGuard(module, action)` middleware:
```javascript
router.post('/', verifyToken, roleGuard('products', 'can_create'), createProduct);
```
If a user lacks the permission, the API returns `403 Forbidden`.

### Frontend Guards (`PermissionGuard`)
UI elements are conditionally rendered using the `PermissionGuard` component:
```jsx
<PermissionGuard module="products" action="can_create">
  <Button>Add Product</Button>
</PermissionGuard>
```

### Zustand Store (`useAuthStore`)
The frontend stores permissions in Zustand. The `can(module, action)` function checks if the current user has the required privilege. 
Super Admins (`role_id === 1`) automatically bypass all permission checks and have full access to the system.
