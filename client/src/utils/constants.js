import {
  ShoppingOutlined,
  BankOutlined,
  TeamOutlined,
  LinkOutlined,
} from '@ant-design/icons';

// -------------------------
// General Shared Constants
// -------------------------
export const LANGUAGES = [
  { value: 'ENGLISH',  label: 'English' },
  { value: 'HINDI',    label: 'Hindi' },
  { value: 'REGIONAL', label: 'Regional' },
];

export const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

// -------------------------
// Dashboard Constants
// -------------------------
export const STAT_CARDS = [
  { key: 'totalProducts', title: 'Active Products', icon: ShoppingOutlined, color: '#1890ff', bg: '#e6f7ff' },
  { key: 'totalCompanies', title: 'Active Companies', icon: BankOutlined, color: '#52c41a', bg: '#f6ffed' },
  { key: 'totalContacts', title: 'Active Contacts', icon: TeamOutlined, color: '#fa8c16', bg: '#fff7e6' },
  { key: 'activeMappings', title: 'Active Mappings', icon: LinkOutlined, color: '#722ed1', bg: '#f9f0ff' },
];

export const TYPE_COLORS = {
  MANUFACTURER: '#1890ff',
  SUPPLIER: '#52c41a',
  BUYER: '#fa8c16',
  DISTRIBUTOR: '#722ed1',
};

// -------------------------
// Products Constants
// -------------------------
export const PRODUCT_STATUS_OPTIONS = [
  { value: 0, label: 'Active',   color: 'green' },
  { value: 1, label: 'Draft',    color: 'orange' },
  { value: 2, label: 'Inactive', color: 'red' },
];

export const UOM_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ltr', label: 'Liters (ltr)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'ton', label: 'Tons' },
  { value: 'box', label: 'Boxes' },
];

export const STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Inactive' },
];

// -------------------------
// Companies Constants
// -------------------------
export const COMPANY_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER',     label: 'Supplier',     color: 'green' },
  { value: 'BUYER',        label: 'Buyer',         color: 'orange' },
  { value: 'DISTRIBUTOR',  label: 'Distributor',   color: 'purple' },
];

// -------------------------
// Contacts Constants
// -------------------------
export const CONTACT_TYPES = [
  { value: 'BUYER',            label: 'Buyer',            color: 'orange' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager', color: 'blue' },
  { value: 'SALES',            label: 'Sales',            color: 'green' },
  { value: 'ADMIN',            label: 'Admin',            color: 'purple' },
];

// -------------------------
// Mappings Constants
// -------------------------
export const ROLE_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER',     label: 'Supplier',     color: 'green' },
  { value: 'DISTRIBUTOR',  label: 'Distributor',  color: 'purple' },
];

// -------------------------
// Enquiries & Permissions Constants
// -------------------------
export const MODULE_LABELS = {
  PRODUCT:    'Product',
  COMPANY:    'Company',
  MAPPING:    'Mapping',
  PERMISSION: 'Permissions',
  ROLE:       'Roles',
  MASTERS:    'Masters',
  products:           'Products',
  companies:          'Companies',
  mappings:           'Product Mapping',
  contacts:           'Contacts',
  packaging:          'Packaging',
  categories:         'Categories',
  departments:        'Departments',
  grades:             'Grades',
  users:              'User Management',
  roles:              'Roles & Rights',
  dashboard:          'Dashboard',
  locations_countries:'Locations',
};

export const MODULE_COLORS = {
  PRODUCT:    'blue',
  COMPANY:    'purple',
  MAPPING:    'cyan',
  PERMISSION: 'orange',
  ROLE:       'red',
  MASTERS:    'green',
};

export const STATUS_FILTER_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'OPEN',        label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED',    label: 'Resolved' },
];

export const MODULE_FILTER_OPTIONS = [
  { value: '',           label: 'All Modules' },
  { value: 'PRODUCT',    label: 'Product' },
  { value: 'COMPANY',    label: 'Company' },
  { value: 'MAPPING',    label: 'Mapping' },
  { value: 'PERMISSION', label: 'Permissions' },
  { value: 'ROLE',       label: 'Roles' },
  { value: 'MASTERS',    label: 'Masters' },
];

export const ALL_MODULES = [
  'products', 'companies', 'mappings', 'contacts',
  'categories', 'grades', 'packaging', 'departments',
  'users', 'locations_countries'
];

export const ACTION_LABELS = {
  can_view: 'View',
  can_create: 'Create',
  can_edit: 'Edit',
  can_delete: 'Delete',
};

export const ALL_MODULE_OPTIONS = [
  { value: 'PRODUCT', label: 'Product', permKey: 'products' },
  { value: 'COMPANY', label: 'Company', permKey: 'companies' },
  { value: 'MAPPING', label: 'Mapping', permKey: 'mappings' },
  { value: 'PERMISSION', label: 'Permissions', permKey: null },
  { value: 'ROLE', label: 'Roles', permKey: null },
  { value: 'MASTERS', label: 'Masters (Categories, Grades, etc.)', permKey: null },
];

export const MODULES_WITH_RECORDS = ['PRODUCT', 'COMPANY', 'MAPPING'];
