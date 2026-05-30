import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useCompanies = ({ page = 1, limit = 20, search = '', company_type = '', status = '' }) => {
  return useQuery({
    queryKey: ['companies', page, limit, search, company_type, status],
    queryFn: async () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (company_type) params.company_type = company_type;
      if (status) params.status = status;
      const res = await api.get('/companies', { params });
      return res.data;
    },
  });
};

export const useCompany = (id) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      const res = await api.get(`/companies/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/companies', data),
    onSuccess: () => {
      message.success('Company created successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to create company');
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/companies/${id}`, data),
    onSuccess: () => {
      message.success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update company');
    },
  });
};

export const useDeactivateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/companies/${id}/deactivate`),
    onSuccess: () => {
      message.success('Company deactivated');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to deactivate');
    },
  });
};

export const useReactivateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/companies/${id}/reactivate`),
    onSuccess: () => {
      message.success('Company reactivated');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to reactivate');
    },
  });
};