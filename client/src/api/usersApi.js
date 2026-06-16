import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useUsers = ({ page = 1, limit = 20, search = '', status = '' }) => {
  return useQuery({
    queryKey: ['users', page, limit, search, status],
    queryFn: async () => {
      const res = await api.get('/users', { params: { page, limit, search, status } });
      return res.data;
    },
  });
};

export const useUserFormData = () => {
  return useQuery({
    queryKey: ['users', 'form-data'],
    queryFn: async () => {
      const res = await api.get('/users/form-data');
      return res.data.data; // { roles, departments }
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to create user');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update user');
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/deactivate`),
    onSuccess: () => {
      message.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to deactivate user');
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/reactivate`),
    onSuccess: () => {
      message.success('User reactivated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ userId, newPassword }) =>
      api.patch(`/users/${userId}/reset-password`, { new_password: newPassword }),
    onSuccess: () => { message.success('Password reset. User session terminated.'); },
    onError: (err) => { message.error(err?.response?.data?.message || 'Failed to reset password'); }
  });
};
