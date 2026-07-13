import { useState, useEffect, useCallback } from 'react';
import { Form } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useContacts, useContact,
  useCreateContact, useUpdateContact,
  useDeactivateContact, useReactivateContact, useDeleteContact,
  useCompanyOptions, useProductOptions, useBranchesByCompany,
} from '../../api/contactsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useDebounce from '../../hooks/useDebounce';

export function useContactsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterLang, setFilterLang]       = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [importOpen, setImportOpen]       = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [viewId, setViewId]               = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data: listData, isLoading } = useContacts({
    page, search: debouncedSearch, contact_type: filterType,
    preferred_language: filterLang, product_id: filterProduct, status: filterStatus,
  });
  const { data: editData }                      = useContact(editingId);
  const { data: companyOptions }                = useCompanyOptions();
  const { data: productOptions }                = useProductOptions();
  const { data: branchOptions }                 = useBranchesByCompany(selectedCompanyId);
  const { mutate: create, isPending: creating } = useCreateContact();
  const { mutate: update, isPending: updating } = useUpdateContact();
  const { mutate: deactivate }                  = useDeactivateContact();
  const { mutate: reactivate }                  = useReactivateContact();
  const { mutate: deleteContact }               = useDeleteContact();
  const { applyServerErrors }                   = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      const tags = editData.tags ? JSON.parse(editData.tags) : [];
      const product_ids = (editData.interests || []).map(i => i.product_id);
      form.setFieldsValue({ ...editData, tags, product_ids });
      setSelectedCompanyId(editData.company_id || null);
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setSelectedCompanyId(null);
    form.resetFields();
    form.setFieldsValue({ status_flag: 0 });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.contact_id);
    setModalOpen(true);
  }, []);

  const handleCompanyChange = useCallback((companyId) => {
    setSelectedCompanyId(companyId || null);
    form.setFieldValue('branch_id', null);
  }, [form]);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); setSelectedCompanyId(null); },
        onError:   (err) => applyServerErrors(err),
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); setSelectedCompanyId(null); },
        onError:   (err) => applyServerErrors(err),
      });
    }
  }, [editingId, update, create, applyServerErrors]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteContact(deleteTarget.contact_id, {
      onSuccess: () => setDeleteTarget(null),
      onError:   () => setDeleteTarget(null),
    });
  }, [deleteContact, deleteTarget]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  }, [queryClient]);

  return {
    page, setPage,
    search, setSearch,
    filterType, setFilterType,
    filterLang, setFilterLang,
    filterProduct, setFilterProduct,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    selectedCompanyId,
    viewId, setViewId,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    companyOptions, productOptions, branchOptions,
    handleAdd, handleEdit, handleCompanyChange, handleSubmit,
    handleDeleteConfirm, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  };
}
