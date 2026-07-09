import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

// ── Generic master hook factory ───────────────────────────
// Builds all 4 sets of hooks from one factory to avoid repetition

const createMasterHooks = (endpoint, queryKey, idField, nameField) => {
  const useList = () => useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await api.get(`/${endpoint}`);
      return res.data.data;
    },
  });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data) => api.post(`/${endpoint}`, data),
      onSuccess: () => {
        message.success(`${queryKey.slice(0, -1)} created successfully`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }) => api.put(`/${endpoint}/${id}`, data),
      onSuccess: () => {
        message.success(`${queryKey.slice(0, -1)} updated successfully`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => api.delete(`/${endpoint}/${id}`),
      onSuccess: () => {
        message.success(`${queryKey.slice(0, -1)} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  };

  return { useList, useCreate, useUpdate, useDelete };
};

// ── Export hooks for each master ──────────────────────
export const categoryHooks = createMasterHooks('categories', 'categories', 'category_id', 'category_name');
export const gradeHooks = createMasterHooks('grades', 'grades', 'grade_id', 'grade_name');
export const packagingHooks = createMasterHooks('packaging', 'packaging', 'packaging_id', 'packaging_name');
export const departmentHooks = createMasterHooks('departments', 'departments', 'department_id', 'department_name');
