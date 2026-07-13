import { useState, useEffect, useCallback } from 'react';
import { Form } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProducts, useProduct, useProductFormData,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useDeactivateProduct, useReactivateProduct,
} from '../../api/productsApi';
import { useUploadDocument } from '../../api/documentsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useDebounce from '../../hooks/useDebounce';

export function useProductsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data: listData, isLoading } = useProducts({
    page, search: debouncedSearch,
    category_id: filterCategory, grade_id: filterGrade, status: filterStatus,
  });
  const { data: editData }                      = useProduct(editingId);
  const { data: formData }                      = useProductFormData();
  const { mutate: create, isPending: creating } = useCreateProduct();
  const { mutate: update, isPending: updating } = useUpdateProduct();
  const { mutate: deleteProduct }               = useDeleteProduct();
  const { mutate: deactivate }                  = useDeactivateProduct();
  const { mutate: reactivate }                  = useReactivateProduct();
  const { mutateAsync: uploadDoc }              = useUploadDocument();
  const { applyServerErrors }                   = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) form.setFieldsValue(editData);
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status_flag: 0 });
    setUploadFiles([]);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.product_id);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.product_id, {
      onSuccess: () => setDeleteTarget(null),
      onError:   () => setDeleteTarget(null),
    });
  }, [deleteProduct, deleteTarget]);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError:   (err) => applyServerErrors(err),
      });
    } else {
      create(values, {
        onSuccess: async (res) => {
          const productId = res?.data?.data?.product_id;
          if (productId && uploadFiles.length > 0) {
            for (const file of uploadFiles) {
              const fd = new FormData();
              fd.append('file', file.originFileObj || file);
              fd.append('entity_type', 'PRODUCT');
              fd.append('entity_id', productId);
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
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  return {
    // state
    page, setPage,
    search, setSearch,
    filterCategory, setFilterCategory,
    filterGrade, setFilterGrade,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    viewId, setViewId,
    uploadFiles, setUploadFiles,
    deleteTarget, setDeleteTarget,
    // data
    listData, isLoading, formData,
    creating, updating,
    // handlers
    handleAdd, handleEdit, handleDelete, handleSubmit, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  };
}
