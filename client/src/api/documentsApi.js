import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

export const useDocuments = (entityType, entityId) => {
  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const res = await api.get(`/documents/${entityType}/${entityId}`);
      return res.data.data;
    },
    enabled: !!entityId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => {
      return api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (_, variables) => {
      message.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents', variables.get('entity_type').toLowerCase(), Number(variables.get('entity_id'))] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to upload document');
    }
  });
};

export const useDeleteDocument = (entityType, entityId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId) => api.delete(`/documents/${docId}`),
    onSuccess: () => {
      message.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || 'Failed to delete document');
    }
  });
};
