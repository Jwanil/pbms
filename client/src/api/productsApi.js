import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useProducts = ({ page = 1, limit = 20, search = '', category_id = '', grade_id = '', status = '', enabled = true }) => {
  return useQuery({
    queryKey: ['products', page, limit, search, category_id, grade_id, status],
    queryFn: async () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (category_id) params.category_id = category_id;
      if (grade_id) params.grade_id = grade_id;
      if (status !== '') params.status = status;
      const res = await api.get('/products', { params });
      return res.data; // { success, data: [...], pagination: {...} }
    },
    enabled,
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useProductFormData = () => {
  return useQuery({
    queryKey: ['products', 'form-data'],
    queryFn: async () => {
      const res = await api.get('/products/form-data');
      return res.data.data; // { categories, grades, packaging }
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      message.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      message.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeactivateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/deactivate`),
    onSuccess: () => {
      message.success('Product deactivated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useReactivateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/reactivate`),
    onSuccess: () => {
      message.success('Product reactivated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      message.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};