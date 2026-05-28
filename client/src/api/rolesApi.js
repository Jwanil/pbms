import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useEffect } from 'react';
import api from './axiosInstance';
import useAuthStore from '../store/authStore';

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data; // array of { role_id, role_name, description }
    },
  });
};

export const useRolePermissions = (roleId) => {
  const query = useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: async () => {
      const res = await api.get(`/roles/${roleId}/permissions`);
      return res.data.data; // { role_id, role_name, permissions: [...] }
    },
    enabled: !!roleId,
  });
  return query;
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { user, token, setAuth } = useAuthStore();

  return useMutation({
    mutationFn: ({ roleId, permissions }) =>
      api.put(`/roles/${roleId}/permissions`, { permissions }),
    onSuccess: async (_, variables) => {
      message.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'permissions'] });

      // If the updated role is the current user's role, refresh their permissions in Zustand
      if (user && variables.roleId === user.role_id) {
        try {
          const res = await api.get('/auth/me');
          const { user: updatedUser, permissions } = res.data.data;
          setAuth(updatedUser, token, permissions);
        } catch {
          // Silent fail — permissions will refresh on next page load
        }
      }
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update permissions');
    },
  });
};
