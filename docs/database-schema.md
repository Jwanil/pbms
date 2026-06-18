# Database Schema Overview

PBMS uses MySQL managed by Prisma ORM. 
The single source of truth is `server/prisma/schema.prisma`.

## Core Entities

### User
Stores application users (Super Admin, Admins, Staff).
- Fields: `user_id`, `name`, `email`, `username`, `password_hash`, `role_id`, `department_id`, `status`.
- Soft Delete: via `status` ('ACTIVE' | 'INACTIVE').

### Role & Permission
- `Role`: Standard roles (SUPER_ADMIN, ADMIN, STAFF).
- `Permission`: User-level granular permissions per module. `user_id`, `module_name`, `can_view`, `can_create`, `can_edit`, `can_delete`.

### Product
- Fields: `product_id`, `product_name`, `sku`, `cas_number`, `category_id`, `grade_id`, `packaging_id`, `unit_of_measure`, `status`, etc.
- Soft Delete: `status` ('ACTIVE' | 'INACTIVE').

### Company & Branch
- `Company`: Represents a business entity (Buyer, Supplier). `company_name`, `company_type`, etc.
- `Branch`: Child to Company. Supports multiple locations per company.
- Both use `status` for soft delete.

### Contact & ContactProductInterest
- `Contact`: People associated with Companies/Branches.
- `ContactProductInterest`: Junction table tracking a Contact's interest level in specific Products.

### ProductCompanyMapping
- Tracks the relationship between a Product and a Company (e.g. Company X is a Manufacturer of Product Y).
- Fields: `mapping_id`, `product_id`, `company_id`, `role_type`, `is_active`.
- Soft Delete: `is_active` (boolean).

## Masters

- `Category`, `Grade`, `Packaging`, `Department`: Lookup tables. 
- `Country`, `State`, `City`: Hierarchical location tables with cascading deactivation capabilities (`is_active`).

## Audit & Documents

- `AuditLog`: Immutable ledger of user actions. Tracks `user_id`, `action`, `module`, `entity_id`, and `details` (JSON).
- `Document`: Polymorphic table for tracking file uploads across the system (`entity_type` + `entity_id`).