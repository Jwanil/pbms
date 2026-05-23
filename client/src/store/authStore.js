import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,            // { user_id, name, email, username, role }
      token: null,           // JWT access token string
      permissions: {},       // { module_name: { can_view, can_create, can_edit, can_delete } }
      isAuthenticated: false,

      // Actions — Phase 2 will call these
      setAuth: (user, token, permissions) =>
        set({ user, token, permissions, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, token: null, permissions: {}, isAuthenticated: false }),

      // Permission helper — used by UI to show/hide action buttons
      can: (module, action) => {
        const state = useAuthStore.getState();
        return state.permissions?.[module]?.[action] === true;
      },
    }),
    {
      name: 'pbms-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
