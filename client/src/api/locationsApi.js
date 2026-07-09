import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';

// ─── COUNTRIES ───────────────────────────────────────────────────────────────

export const useCountries = ({ includeInactive = false } = {}) =>
  useQuery({
    queryKey: ['locations', 'countries', includeInactive],
    queryFn: async () => {
      const res = await api.get('/locations/countries', { params: includeInactive ? { include_inactive: true } : {} });
      return res.data.data;
    },
  });

export const useCreateCountry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/locations/countries', data),
    onSuccess: () => { message.success('Country created'); qc.invalidateQueries({ queryKey: ['locations', 'countries'] }); },
  });
};

export const useUpdateCountry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/locations/countries/${id}`, data),
    onSuccess: () => { message.success('Country updated'); qc.invalidateQueries({ queryKey: ['locations', 'countries'] }); },
  });
};

export const useDeactivateCountry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/countries/${id}/deactivate`),
    onSuccess: () => { message.success('Country deactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};

export const useReactivateCountry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/countries/${id}/reactivate`),
    onSuccess: () => { message.success('Country reactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};

// ─── STATES ──────────────────────────────────────────────────────────────────

export const useStates = ({ countryId, includeInactive = false, enabled = true } = {}) =>
  useQuery({
    queryKey: ['locations', 'states', countryId, includeInactive],
    queryFn: async () => {
      const params = {};
      if (countryId) params.country_id = countryId;
      if (includeInactive) params.include_inactive = true;
      const res = await api.get('/locations/states', { params });
      return res.data.data;
    },
    enabled,
  });

export const useCreateState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/locations/states', data),
    onSuccess: () => { message.success('State created'); qc.invalidateQueries({ queryKey: ['locations', 'states'] }); },
  });
};

export const useUpdateState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/locations/states/${id}`, data),
    onSuccess: () => { message.success('State updated'); qc.invalidateQueries({ queryKey: ['locations', 'states'] }); },
  });
};

export const useDeactivateState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/states/${id}/deactivate`),
    onSuccess: () => { message.success('State deactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};

export const useReactivateState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/states/${id}/reactivate`),
    onSuccess: () => { message.success('State reactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};

// ─── CITIES ──────────────────────────────────────────────────────────────────

export const useCities = ({ stateId, includeInactive = false, enabled = true } = {}) =>
  useQuery({
    queryKey: ['locations', 'cities', stateId, includeInactive],
    queryFn: async () => {
      const params = {};
      if (stateId) params.state_id = stateId;
      if (includeInactive) params.include_inactive = true;
      const res = await api.get('/locations/cities', { params });
      return res.data.data;
    },
    enabled,
  });

export const useCreateCity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/locations/cities', data),
    onSuccess: () => { message.success('City created'); qc.invalidateQueries({ queryKey: ['locations', 'cities'] }); },
  });
};

export const useUpdateCity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/locations/cities/${id}`, data),
    onSuccess: () => { message.success('City updated'); qc.invalidateQueries({ queryKey: ['locations', 'cities'] }); },
  });
};

export const useDeactivateCity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/cities/${id}/deactivate`),
    onSuccess: () => { message.success('City deactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};

export const useReactivateCity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/locations/cities/${id}/reactivate`),
    onSuccess: () => { message.success('City reactivated'); qc.invalidateQueries({ queryKey: ['locations'] }); },
  });
};
