import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './components/AppLayout';

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
import RolesPage from './pages/roles/RolesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="mapping" element={<MappingPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="masters/categories" element={<CategoriesPage />} />
        <Route path="masters/grades" element={<GradesPage />} />
        <Route path="masters/packaging" element={<PackagingPage />} />
        <Route path="masters/departments" element={<DepartmentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
