import { createBrowserRouter, createRoutesFromElements, Route, Navigate, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './components/AppLayout';
import PermissionRoute from './components/PermissionRoute';
import { useRevalidateSession } from './api/authApi';

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

// Created the router object cleanly outside the component
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="products" element={<PermissionRoute module="products"><ProductsPage /></PermissionRoute>} />
        <Route path="companies" element={<PermissionRoute module="companies"><CompaniesPage /></PermissionRoute>} />
        <Route path="mapping" element={<PermissionRoute module="mappings"><MappingPage /></PermissionRoute>} />
        <Route path="contacts" element={<PermissionRoute module="contacts"><ContactsPage /></PermissionRoute>} />
        <Route path="masters/categories" element={<PermissionRoute module="categories"><CategoriesPage /></PermissionRoute>} />
        <Route path="masters/grades" element={<PermissionRoute module="grades"><GradesPage /></PermissionRoute>} />
        <Route path="masters/packaging" element={<PermissionRoute module="packaging"><PackagingPage /></PermissionRoute>} />
        <Route path="masters/departments" element={<PermissionRoute module="departments"><DepartmentsPage /></PermissionRoute>} />
        <Route path="users" element={<PermissionRoute module="users"><UsersPage /></PermissionRoute>} />
        <Route path="masters/locations" element={<PermissionRoute module="locations_countries"><LocationsPage /></PermissionRoute>} />
        <Route path="enquiries/new" element={<EnquiryForm />} />
        <Route path="enquiries/mine" element={<MyQueriesPage />} />
        <Route path="enquiries/admin" element={<EnquiriesAdminPage />} />
        <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  )
);

function App() {
  // Revalidate session on every app load
  useRevalidateSession();

  return <RouterProvider router={router} />;
}

export default App;
