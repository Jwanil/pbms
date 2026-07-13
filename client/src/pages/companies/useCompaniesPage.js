import { useState, useEffect, useCallback } from 'react';
import { Form } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCompanies, useCompany,
  useCreateCompany, useUpdateCompany,
  useDeactivateCompany, useReactivateCompany, useDeleteCompany,
} from '../../api/companiesApi';
import { useUploadDocument } from '../../api/documentsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useDebounce from '../../hooks/useDebounce';

export function useCompaniesPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [importOpen, setImportOpen]   = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [viewId, setViewId]           = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data: listData, isLoading } = useCompanies({ page, search: debouncedSearch, company_type: filterType, status: filterStatus });
  const { data: editData }                      = useCompany(editingId);
  const { mutate: create, isPending: creating } = useCreateCompany();
  const { mutate: update, isPending: updating } = useUpdateCompany();
  const { mutate: deactivate }                  = useDeactivateCompany();
  const { mutate: reactivate }                  = useReactivateCompany();
  const { mutate: deleteCompany }               = useDeleteCompany();
  const { mutateAsync: uploadDoc }              = useUploadDocument();
  const { applyServerErrors }                   = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue({ ...editData, branches: editData.branches || [] });
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ branches: [] });
    setUploadFiles([]);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.company_id);
    setModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteCompany(deleteTarget.company_id, {
      onSuccess: () => setDeleteTarget(null),
      onError:   () => setDeleteTarget(null),
    });
  }, [deleteCompany, deleteTarget]);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError:   (err) => applyServerErrors(err),
      });
    } else {
      create(values, {
        onSuccess: async (res) => {
          const companyId = res?.data?.data?.company_id;
          if (companyId && uploadFiles.length > 0) {
            for (const file of uploadFiles) {
              const fd = new FormData();
              fd.append('file', file.originFileObj || file);
              fd.append('entity_type', 'COMPANY');
              fd.append('entity_id', companyId);
              try { await uploadDoc(fd); } catch { /* ignore */ }
            }
          }
          setModalOpen(false);
          setUploadFiles([]);
        },
        onError: (err) => applyServerErrors(err),
      });
    }
  }, [editingId, update, create, uploadFiles, uploadDoc, applyServerErrors]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  }, [queryClient]);

  return {
    page, setPage,
    search, setSearch,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    viewId, setViewId,
    uploadFiles, setUploadFiles,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    handleAdd, handleEdit, handleDeleteConfirm, handleSubmit, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  };
}
