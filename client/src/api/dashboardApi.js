import { useQuery } from '@tanstack/react-query';
import api from './axiosInstance';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

export const useDashboardActivity = (limit = 50) => {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: async () => {
      const res = await api.get('/dashboard/activity', { params: { limit } });
      return res.data.data;
    },
    refetchInterval: 30000,
  });
};
