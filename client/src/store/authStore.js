import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,            // { user_id, name, email, username, role }
      token: null,           // JWT access token string
      permissions: {},       // { module_name: { can_view, can_create, can_edit, can_delete } }
      isAuthenticated: false,


      setAuth: (user, token, permissions) =>
        set({ user, token, permissions, isAuthenticated: true }),
      setToken: (token) => set({ token }),
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
      storage: createJSONStorage(() => sessionStorage),
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
