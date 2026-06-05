import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';
import useAuthStore from '../store/authStore';

export const useUserPermissions = (userId) => {
  return useQuery({
    queryKey: ['users', userId, 'permissions'],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/permissions`);
      return res.data.data;
    },
    enabled: !!userId,
  });
};

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissions }) =>
      api.put(`/users/${userId}/permissions`, { permissions }),
    onSuccess: async (_, variables) => {
      message.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'permissions'] });

      // If editing the current logged-in user's permissions, refresh their Zustand store
      const { user, token, setAuth } = useAuthStore.getState();
      if (user && variables.userId === user.user_id) {
        try {
          const res = await api.get('/auth/me');
          const { user: updatedUser, permissions } = res.data.data;
          setAuth(updatedUser, token, permissions);
        } catch {
          // Silent fail
        }
      }
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update permissions');
    },
  });
};
