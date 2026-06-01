import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import api from './axiosInstance';
import useAuthStore from '../store/authStore';

// -- Login mutation --
export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await api.post('/auth/login', { email, password });
      return res.data.data; // { token, user, permissions }
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.permissions);
      navigate('/dashboard', { replace: true });
    },
  });
};

// -- Logout mutation --
export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
    onError: () => {
      // Even if logout API fails, clear local state
      clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
};

// -- Session revalidation on app load --
export const useRevalidateSession = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const token = useAuthStore((state) => state.token);

  // Track the initial auth state at mount time.
  // If auth was already true when the component first mounted (i.e. page refresh
  // with persisted Zustand state), we revalidate. If auth was false at mount
  // (fresh visit) and became true later (login mutation), we skip revalidation
  // because the login response already provided fresh data.
  const wasAuthenticatedAtMount = useRef(isAuthenticated);

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data; // { user, permissions }
    },
    enabled: isAuthenticated && wasAuthenticatedAtMount.current,
    retry: false,
  });

  // React Query v5 removed onSuccess/onError from useQuery options.
  // Use useEffect watching query state instead.
  useEffect(() => {
    if (query.data) {
      setAuth(query.data.user, token, query.data.permissions);
    }
  }, [query.data, setAuth, token]);

  useEffect(() => {
    if (query.error) {
      clearAuth();
    }
  }, [query.error, clearAuth]);

  return query;
};
