import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './axiosInstance';
import { message } from 'antd';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile');
      return response.data.data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/profile', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to update profile');
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/profile/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Password changed successfully');
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to change password');
    }
  });
};