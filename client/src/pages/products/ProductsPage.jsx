import { useState, useEffect, useMemo, useCallback } from 'react';
import './ProductsPage.css';
import { Table, Button, Space, Input, Select, Form, Tabs, InputNumber, Modal, Row, Col, Divider, Tag, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, UploadOutlined, WarningFilled, DeleteOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import ProductViewDrawer from '../../components/ProductViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import {
  useProducts, useProduct, useProductFormData,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useDeactivateProduct, useReactivateProduct
} from '../../api/productsApi';
import { useUploadDocument } from '../../api/documentsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';
import useDebounce  from '../../hooks/useDebounce';

function ProductsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); 
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  // Controlled deactivate modals (antd v5 recommended pattern)
  // const [deactivateTarget, setDeactivateTarget] = useState(null);   // record to confirm-deactivate
  const [deleteTarget, setDeleteTarget] = useState(null);         // record to confirm-delete
  // const [mappingBlockTarget, setMappingBlockTarget] = useState(null); // record blocked due to mappings

  const { data: listData, isLoading } = useProducts({ page, search: debouncedSearch, category_id: filterCategory, grade_id: filterGrade, status: filterStatus });
  const { data: editData } = useProduct(editingId);
  const { data: formData } = useProductFormData();
  const { mutate: create, isPending: creating } = useCreateProduct();
  const { mutate: update, isPending: updating } = useUpdateProduct();
  // const { mutate: deactivate, isPending: deactivating } = useDeactivateProduct();
  // const { mutate: reactivate } = useReactivateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  const { mutate: deactivate } = useDeactivateProduct();
  const { mutate: reactivate } = useReactivateProduct();
  const { mutateAsync: uploadDoc } = useUploadDocument();
  const { applyServerErrors } = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue(editData);
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status_flag: 0 }); // Default to Active
    setUploadFiles([]);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.product_id);
    setModalOpen(true);
  }, []);

  // const handleDeactivateClick = useCallback((record) => {
  //   const activeMappings = record._count?.mappings ?? 0;
  //   if (activeMappings > 0) {
  //     setMappingBlockTarget(record);
  //   } else {
  //     setDeactivateTarget(record);
  //   }
  // }, []);

  // const handleDeactivateConfirm = useCallback(() => {
  //   if (!deactivateTarget) return;
  //   deactivate(deactivateTarget.product_id, {
  //     onSuccess: () => setDeactivateTarget(null),
  //     onError: () => setDeactivateTarget(null),
  //   });
  // }, [deactivate, deactivateTarget]);


  const handleDelete = useCallback((record)=>{

    if(!deleteTarget) return;
    deleteProduct(deleteTarget.product_id,
      {
        onSuccess:()=>setDeleteTarget(null),
        onError:()=>setDeleteTarget(null),
      }
    );
    
  },[deleteProduct,deleteTarget])

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError: (err) => {
          applyServerErrors(err);
          
        },
      });
    } else {
      create(values, {
        onSuccess: async (res) => {
          const productId = res?.data?.data?.product_id;
          if (productId && uploadFiles.length > 0) {
            for (let file of uploadFiles) {
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
        onError: (err) => {
          applyServerErrors(err);
          
        },
      });
    }
  }, [editingId, update, create, uploadFiles, uploadDoc, applyServerErrors]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);
  const handleCategoryFilter = useCallback((v) => { setFilterCategory(v || ''); setPage(1); }, []);
  const handleGradeFilter = useCallback((v) => { setFilterGrade(v || ''); setPage(1); }, []);
  const handleStatusFilter = useCallback((v) => { setFilterStatus(v || ''); setPage(1); }, []);

  const categoryOptions = useMemo(() =>
    (formData?.categories || []).map(c => ({ value: c.category_id, label: c.category_name })),
    [formData?.categories]
  );
  const gradeOptions = useMemo(() =>
    (formData?.grades || []).map(g => ({ value: g.grade_id, label: g.grade_name })),
    [formData?.grades]
  );
  const packagingOptions = useMemo(() =>
    (formData?.packaging || []).map(p => ({ value: p.packaging_id, label: `${p.packaging_name} (${p.size_value} ${p.size_unit})` })),
    [formData?.packaging]
  );

  const allColumns = useMemo(() => [
    { title: 'Product Name', dataIndex: 'product_name', key: 'product_name', width: 200 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'CAS Number', dataIndex: 'cas_number', key: 'cas_number', width: 130 },
    { title: 'Category', key: 'category', width: 130, render: (_, r) => r.category?.category_name || '—' },
    { title: 'Grade', key: 'grade', width: 100, render: (_, r) => r.grade?.grade_name || '—' },
    { title: 'UOM', dataIndex: 'unit_of_measure', key: 'uom', width: 70 },

    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        const actionLabel = isActive ? 'Deactivate' : isInactive ? 'Reactivate' : null;

        // If status is "deleted" (1), just show badge, no click
        if (!actionLabel) return <StatusBadge status={record.status_flag} />;

        return (
          <PermissionGuard module="products" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this product?`}
              description={
                isActive && record._count?.mappings > 0
                  ? `⚠️ This product has ${record._count.mappings} active mapping(s).`
                  : `Product will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`
              }
              onConfirm={() =>
                isActive
                  ? deactivate(record.product_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) })
                  : reactivate(record.product_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) })
              }
              okText={actionLabel}
              okType={isActive ? 'danger' : 'primary'}
              cancelText="Cancel"
            >
              <span style={{ cursor: 'pointer' }}>
                <StatusBadge status={record.status_flag} />
              </span>
            </Popconfirm>
          </PermissionGuard>
        );
      }
    },

    { title: 'Actions', key: 'actions', width: 220,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="products" action="can_view">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(record.product_id)}>View</Button>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_edit"> 
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          {/* <PermissionGuard module="products" action="can_delete">
          {record.status_flag === 0 ? (
              <Button size="small" icon={<StopOutlined />} onClick={() => handleDeactivateClick(record)}>
                Deactivate
              </Button>
            ) : record.status_flag === 2 ? (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.product_id)}>
                Reactivate
              </Button>
            ) : null}
          </PermissionGuard> */}
          <PermissionGuard module="products" action="can_delete"> 
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(record)}>
              Delete
            </Button>
          </PermissionGuard> 
        </Space>
      ),
    },
  ], [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  const filterBar = useMemo(() => (
    <Space wrap>
      <Select placeholder="Category" allowClear style={{ width: 160 }}
        value={filterCategory || undefined} onChange={handleCategoryFilter}
        options={categoryOptions}
      />
      <Select placeholder="Grade" allowClear style={{ width: 140 }}
        value={filterGrade || undefined} onChange={handleGradeFilter}
        options={gradeOptions}
      />
      <Select placeholder="Status" allowClear style={{ width: 120 }}
        value={filterStatus || undefined} onChange={handleStatusFilter}
        options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]}
      />
    </Space>
  ), [filterCategory, filterGrade, filterStatus, categoryOptions, gradeOptions, handleCategoryFilter, handleGradeFilter, handleStatusFilter]);

  const formTabs = useMemo(() => [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <>
          <Form.Item name="product_name" label="Product Name" rules={[
            { required: true, message: 'Product name is required' },
            { max: 255, message: 'Cannot exceed 255 characters' },
            { whitespace: true, message: 'Product name cannot be blank spaces' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[
            { required: true },
            { max: 100, message: 'SKU cannot exceed 100 characters' },
            { pattern: /^[a-zA-Z0-9\-_\/\.]+$/, message: 'SKU can only contain letters, numbers, and -_/.' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="status_flag" label="Status" rules={[
            { required: true}]}>
            <Select
              options={[
                { value: 0, label: 'Active' },
                { value: 2, label: 'Inactive' },
              ]}
            />
          </Form.Item>
          <Form.Item name="composition" label="Composition"><Input /></Form.Item>
          <Form.Item name="cas_number" label="CAS Number" rules={[{ pattern: /^\d{2,7}-\d{2}-\d{1}$/, message: 'Format: XXXXXXX-XX-X (e.g. 67-64-1)' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Category">
            <Select allowClear placeholder="Select category" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="grade_id" label="Grade">
            <Select allowClear placeholder="Select grade" options={gradeOptions} />
          </Form.Item>
          <Form.Item name="packaging_id" label="Packaging">
            <Select allowClear placeholder="Select packaging" options={packagingOptions} />
          </Form.Item>
          <Form.Item name="unit_of_measure" label="Unit of Measure">
            <Select allowClear placeholder="Select UOM"
              options={[{ value: 'KG', label: 'KG' }, { value: 'LITRE', label: 'Litre' }, { value: 'TON', label: 'Ton' }]}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'business',
      label: 'Business Info',
      children: (
        <>
          <Form.Item name="hsn_code" label="HSN Code"><Input /></Form.Item>
          <Form.Item name="shelf_life" label="Shelf Life"><Input placeholder="e.g. 24 months" /></Form.Item>
          <Form.Item name="industry_application" label="Industry Application"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
          {!editingId && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Form.Item label="Initial Documents">
                <Input type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files))} />
              </Form.Item>
            </>
          )}
        </>
      ),
    },
  ], [categoryOptions, gradeOptions, packagingOptions, editingId]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage product catalog"
        breadcrumbs={['Products']}
        extra={
          <Space>
            <ExportCsvButton module="products" moduleName="Products" />
            <PermissionGuard module="products" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="products" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
                Add Product
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div className="products-toolbar">
        <Input.Search
          placeholder="Search by name, SKU, CAS, or mapped company..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          className="products-toolbar__search"
        />
        <div className="products-toolbar__filters">
          {filterBar}
          <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
        </div>
      </div>

      <Table
        columns={visibleColumns}
        dataSource={listData?.data || []}
        loading={isLoading}
        rowKey="product_id"
        pagination={{
          current: page,
          total: listData?.pagination?.total || 0,
          pageSize: 20,
          showSizeChanger: false,
          showTotal: (t) => `Total ${t} products`,
          onChange: setPage,
        }}
        size="middle"
      />

      {/* ── Controlled: Delete confirm ── */}
      <Modal
        open={!!deleteTarget}
        title="Permanently delete this product?"
        onOk={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        okText="Delete"
        okType="danger"
      >
        {deleteTarget && (
          <p>
            <strong>"{deleteTarget.product_name}"</strong> will be permanently removed.
            This action cannot be undone.
          </p>
        )}
      </Modal>

      <FormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Product' : 'Add Product'}
        loading={creating || updating}
        width={720}
        form={form}
      >
        <Tabs items={formTabs} />
      </FormModal>

      <ProductViewDrawer open={!!viewId} productId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module="products"
        moduleName="Products"
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default ProductsPage;