import { useState, useEffect, useCallback } from 'react';
import { Form } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMappings, useMapping,
  useCreateMapping, useUpdateMapping,
  useDeactivateMapping, useReactivateMapping, useDeleteMapping,
  useCompanyOptions, useProductOptions,
} from '../../api/mappingsApi';
import useFormErrors from '../../hooks/useFormErrors';

export function useMappingPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [page, setPage]                   = useState(1);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRole, setFilterRole]       = useState('');
  const [filterActive, setFilterActive]   = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [viewId, setViewId]               = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  const { data: listData, isLoading } = useMappings({
    page, company_id: filterCompany, product_id: filterProduct,
    role_type: filterRole, status: filterActive,
  });
  const { data: editData }                      = useMapping(editingId);
  const { data: companyOptions }                = useCompanyOptions();
  const { data: productOptions }                = useProductOptions();
  const { mutate: create, isPending: creating } = useCreateMapping();
  const { mutate: update, isPending: updating } = useUpdateMapping();
  const { mutate: deactivate }                  = useDeactivateMapping();
  const { mutate: reactivate }                  = useReactivateMapping();
  const { mutate: deleteMapping }               = useDeleteMapping();
  const { applyServerErrors }                   = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue({
        ...editData,
        moq:             editData.moq             ? Number(editData.moq)             : null,
        price_range_min: editData.price_range_min ? Number(editData.price_range_min) : null,
        price_range_max: editData.price_range_max ? Number(editData.price_range_max) : null,
      });
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status_flag: 0 });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.mapping_id);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      const { moq, price_range_min, price_range_max, lead_time_days } = values;
      update({ id: editingId, data: { moq, price_range_min, price_range_max, lead_time_days } }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError:   (err) => applyServerErrors(err),
      });
    } else {
      create(values, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          if (err?.response?.status === 409) {
            form.setFields([
              { name: 'product_id', errors: ['This mapping already exists for this company.'] },
              { name: 'role_type',  errors: ['This mapping already exists for this company.'] },
            ]);
          }
        },
      });
    }
  }, [editingId, update, create, form, applyServerErrors]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMapping(deleteTarget.mapping_id, {
      onSuccess: () => setDeleteTarget(null),
      onError:   () => setDeleteTarget(null),
    });
  }, [deleteMapping, deleteTarget]);

  return {
    page, setPage,
    filterCompany, setFilterCompany,
    filterProduct, setFilterProduct,
    filterRole, setFilterRole,
    filterActive, setFilterActive,
    modalOpen, setModalOpen,
    editingId, setEditingId,
    viewId, setViewId,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    editData,
    companyOptions, productOptions,
    handleAdd, handleEdit, handleSubmit, handleDeleteConfirm,
    deactivate, reactivate,
    queryClient, form,
  };
}
