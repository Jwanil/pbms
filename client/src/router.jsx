import { Navigate } from 'react-router-dom';
import {
  DashboardOutlined, AppstoreOutlined, BankOutlined,
  SwapOutlined, ContactsOutlined, TagsOutlined,
  UserOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';

import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './components/AppLayout';
import PermissionRoute from './components/PermissionRoute';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import CompaniesPage from './pages/companies/CompaniesPage';
import MappingPage from './pages/mapping/MappingPage';
import ContactsPage from './pages/contacts/ContactsPage';
import CategoriesPage from './pages/masters/CategoriesPage';
import GradesPage from './pages/masters/GradesPage';
import PackagingPage from './pages/masters/PackagingPage';
import DepartmentsPage from './pages/masters/DepartmentsPage';
import UsersPage from './pages/users/UsersPage';
import ProfilePage from './pages/profile/ProfilePage';
import LocationsPage from './pages/locations/LocationsPage';
import EnquiryForm from './pages/enquiries/EnquiryForm';
import MyQueriesPage from './pages/enquiries/MyQueriesPage';
import EnquiriesAdminPage from './pages/enquiries/EnquiriesAdminPage';
import EnquiryDetailPage from './pages/enquiries/EnquiryDetailPage';


export const routes = [
  // Public
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },

  // Authenticated shell
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      // Redirect root -> dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Dashboard
      {
        path: 'dashboard',
        element: <DashboardPage />,
        label: 'Dashboard',
        icon: <DashboardOutlined />,
        showInNav: true,
      },

      // Profile (no sidebar link)
      {
        path: 'profile',
        element: <ProfilePage />,
        showInNav: false,
      },

      // Products
      {
        path: 'products',
        element: <PermissionRoute module="products"><ProductsPage /></PermissionRoute>,
        label: 'Products',
        icon: <AppstoreOutlined />,
        module: 'products',
        showInNav: true,
      },

      // Companies
      {
        path: 'companies',
        element: <PermissionRoute module="companies"><CompaniesPage /></PermissionRoute>,
        label: 'Companies',
        icon: <BankOutlined />,
        module: 'companies',
        showInNav: true,
      },

      // Product Mapping
      {
        path: 'mapping',
        element: <PermissionRoute module="mappings"><MappingPage /></PermissionRoute>,
        label: 'Product Mapping',
        icon: <SwapOutlined />,
        module: 'mappings',
        showInNav: true,
      },

      // Contacts
      {
        path: 'contacts',
        element: <PermissionRoute module="contacts"><ContactsPage /></PermissionRoute>,
        label: 'Contacts',
        icon: <ContactsOutlined />,
        module: 'contacts',
        showInNav: true,
      },

      // Masters group
      {
        path: 'masters/categories',
        element: <PermissionRoute module="categories"><CategoriesPage /></PermissionRoute>,
        label: 'Categories',
        module: 'categories',
        group: 'masters',
        groupLabel: 'Masters',
        groupIcon: <TagsOutlined />,
        showInNav: true,
      },
      {
        path: 'masters/grades',
        element: <PermissionRoute module="grades"><GradesPage /></PermissionRoute>,
        label: 'Grades',
        module: 'grades',
        group: 'masters',
        groupLabel: 'Masters',
        groupIcon: <TagsOutlined />,
        showInNav: true,
      },
      {
        path: 'masters/packaging',
        element: <PermissionRoute module="packaging"><PackagingPage /></PermissionRoute>,
        label: 'Packaging',
        module: 'packaging',
        group: 'masters',
        groupLabel: 'Masters',
        groupIcon: <TagsOutlined />,
        showInNav: true,
      },
      {
        path: 'masters/departments',
        element: <PermissionRoute module="departments"><DepartmentsPage /></PermissionRoute>,
        label: 'Departments',
        module: 'departments',
        group: 'masters',
        groupLabel: 'Masters',
        groupIcon: <TagsOutlined />,
        showInNav: true,
      },
      {
        path: 'masters/locations',
        element: <PermissionRoute module="locations_countries"><LocationsPage /></PermissionRoute>,
        label: 'Locations',
        module: 'locations_countries',
        group: 'masters',
        groupLabel: 'Masters',
        groupIcon: <TagsOutlined />,
        showInNav: true,
      },

      // Users
      {
        path: 'users',
        element: <PermissionRoute module="users"><UsersPage /></PermissionRoute>,
        label: 'Users',
        icon: <UserOutlined />,
        module: 'users',
        showInNav: true,
      },

      // Enquiries group
      {
        path: 'enquiries/new',
        element: <EnquiryForm />,
        label: 'New Enquiry',
        group: 'enquiries',
        groupLabel: 'Enquiries',
        groupIcon: <QuestionCircleOutlined />,
        showInNav: true,
        userOnly: true,   // hidden from SUPER_ADMIN
      },
      {
        path: 'enquiries/mine',
        element: <MyQueriesPage />,
        label: 'My Queries',
        group: 'enquiries',
        groupLabel: 'Enquiries',
        groupIcon: <QuestionCircleOutlined />,
        showInNav: true,
        userOnly: true,   // hidden from SUPER_ADMIN
      },
      {
        path: 'enquiries/admin',
        element: <EnquiriesAdminPage />,
        label: 'All Enquiries',
        group: 'enquiries',
        groupLabel: 'Enquiries',
        groupIcon: <QuestionCircleOutlined />,
        showInNav: true,
        adminOnly: true,  // only visible to SUPER_ADMIN
      },

      // Detail view, not in nav
      {
        path: 'enquiries/:id',
        element: <EnquiryDetailPage />,
        showInNav: false,
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
