import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import api from './axiosInstance';


export const useEnquiries = ({page = 1, limit = 10, search = "", status, module_type}) => {
    return useQuery({
        queryKey: ['enquiries', page, limit, search, status, module_type],
        queryFn: async () => {
           const params = { page, limit};
           if(search) params.search = search;
           if(status) params.status = status;
           if(module_type) params.module_type = module_type;

           const res = await api.get('/enquiries/admin', {params});
           return res.data;
        },
    });
};


export const useEnquiry = (id) => {
    return useQuery({
        queryKey: ['view-enquiry', id],
        queryFn: async () => {

            const res = await api.get(`/enquiries/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });
};


export const useMyEnquiries = () => {
    return useQuery({
        queryKey: ['my-enquiries'],
        queryFn: async () => {

            const res = await api.get('/enquiries/mine');
            return res.data.data;
        },
    });
};


export const useCreateEnquiry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/enquiries', data);
            return res.data.data;
        },
        onSuccess: () => {
            message.success('Enquiry Created Successfully')
            queryClient.invalidateQueries(['enquiries']);
        },
    });
};

export const useRespondToEnquiry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, data}) => {
            const res = await api.post(`/enquiries/${id}/respond`,data);
            return res.data.data;
        },
        onSuccess: (_, { id }) => {
            message.success('Enquiry Responded Successfully')
            queryClient.invalidateQueries(['enquiries']);
            queryClient.invalidateQueries(['view-enquiry', id]);
        
        },
    });
};

export const useUpdateEnquiryStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, status}) => {
            const res = await api.patch(`/enquiries/${id}/status`, { status });
            return res.data.data;
        },
        onSuccess: () => {
            message.success('Enquiry Status Updated Successfully')
            queryClient.invalidateQueries({ queryKey: ['enquiries'] });
        },
    });
};
    