import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useContacts = ({ page = 1, limit = 20, search = '', contact_type = '', preferred_language = '', city = '', state = '', tags = '', product_id = '', status = '' }) => {
  return useQuery({
    queryKey: ['contacts', page, limit, search, contact_type, preferred_language, city, state, tags, product_id, status],
    queryFn: async () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (contact_type) params.contact_type = contact_type;
      if (preferred_language) params.preferred_language = preferred_language;
      if (city) params.city = city;
      if (state) params.state = state;
      if (tags) params.tags = tags;
      if (product_id) params.product_id = product_id;
      if (status !== '') params.status = status;
      const res = await api.get('/contacts', { params });
      return res.data;
    },
  });
};

export const useContact = (id) => {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await api.get(`/contacts/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/contacts', data),
    onSuccess: () => {
      message.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/contacts/${id}`, data),
    onSuccess: () => {
      message.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useDeactivateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/contacts/${id}/deactivate`),
    onSuccess: () => {
      message.success('Contact deactivated');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useReactivateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/contacts/${id}/reactivate`),
    onSuccess: () => {
      message.success('Contact reactivated');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      message.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

// Cascading: get branches for a specific company
export const useBranchesByCompany = (companyId) => {
  return useQuery({
    queryKey: ['branches', companyId],
    queryFn: async () => {
      const res = await api.get(`/contacts/branches/${companyId}`);
      return (res.data.data || []).map(b => ({ value: b.branch_id, label: `${b.branch_name} (${b.city || ''})` }));
    },
    enabled: !!companyId,
  });
};

// Reuse from mappingsApi pattern
export const useCompanyOptions = () => {
  return useQuery({
    queryKey: ['companies', 'options'],
    queryFn: async () => {
      const res = await api.get('/companies', { params: { limit: 500, status: 0 } });
      return (res.data.data || []).map(c => ({ value: c.company_id, label: c.company_name }));
    },
  });
};

export const useProductOptions = () => {
  return useQuery({
    queryKey: ['products', 'options'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500, status: 0 } });
      return (res.data.data || []).map(p => ({ value: p.product_id, label: `${p.product_name} (${p.sku})` }));
    },
  });
};