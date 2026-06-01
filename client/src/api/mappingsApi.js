import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useMappings = ({ page = 1, limit = 20, company_id = '', product_id = '', role_type = '', is_active = '' }) => {
  return useQuery({
    queryKey: ['mappings', page, limit, company_id, product_id, role_type, is_active],
    queryFn: async () => {
      const params = { page, limit };
      if (company_id) params.company_id = company_id;
      if (product_id) params.product_id = product_id;
      if (role_type) params.role_type = role_type;
      if (is_active !== '') params.is_active = is_active;
      const res = await api.get('/mappings', { params });
      return res.data;
    },
  });
};

export const useMapping = (id) => {
  return useQuery({
    queryKey: ['mappings', id],
    queryFn: async () => {
      const res = await api.get(`/mappings/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/mappings', data),
    onSuccess: () => {
      message.success('Mapping created successfully');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to create mapping');
    },
  });
};

export const useUpdateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/mappings/${id}`, data),
    onSuccess: () => {
      message.success('Mapping updated successfully');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to update mapping');
    },
  });
};

export const useDeactivateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/mappings/${id}/deactivate`),
    onSuccess: () => {
      message.success('Mapping deactivated');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to deactivate');
    },
  });
};

export const useReactivateMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/mappings/${id}/reactivate`),
    onSuccess: () => {
      message.success('Mapping reactivated');
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to reactivate');
    },
  });
};

// Helper hooks to fetch companies and products for Select dropdowns
export const useCompanyOptions = () => {
  return useQuery({
    queryKey: ['companies', 'options'],
    queryFn: async () => {
      const res = await api.get('/companies', { params: { limit: 500, status: 'ACTIVE' } });
      return (res.data.data || []).map(c => ({ value: c.company_id, label: `${c.company_name} (${c.company_type})` }));
    },
  });
};

export const useProductOptions = () => {
  return useQuery({
    queryKey: ['products', 'options'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500, status: 'ACTIVE' } });
      return (res.data.data || []).map(p => ({ value: p.product_id, label: `${p.product_name} (${p.sku})` }));
    },
  });
};