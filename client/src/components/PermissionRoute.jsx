import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function PermissionRoute({ module, children }) {
  const permissions = useAuthStore((state) => state.permissions);

  // If no permission record for this module, or can_view is false → redirect to dashboard
  if (!permissions?.[module]?.can_view) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PermissionRoute;
