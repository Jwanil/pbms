import useAuthStore from '../store/authStore';

function PermissionGuard({ module, action, children, fallback = null }) {
  const can = useAuthStore((state) => state.can);

  if (!can(module, action)) {
    return fallback;
  }

  return children;
}

export default PermissionGuard;
