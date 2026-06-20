import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Space, Input, Select, Form, Tabs, InputNumber, Modal, Spin, Divider } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, UploadOutlined, WarningFilled } from '@ant-design/icons';
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
  useCreateProduct, useUpdateProduct,
  useDeactivateProduct, useReactivateProduct
} from '../../api/productsApi';
import { useUploadDocument } from '../../api/documentsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';

function ProductsPage() {
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

  const { data: listData, isLoading } = useProducts({ page, search, category_id: filterCategory, grade_id: filterGrade, status: filterStatus });
  const { data: editData } = useProduct(editingId);
  const { data: formData } = useProductFormData();
  const { mutate: create, isPending: creating } = useCreateProduct();
  const { mutate: update, isPending: updating } = useUpdateProduct();
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
    setUploadFiles([]);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.product_id);
    setModalOpen(true);
  }, []);

  const handleDeactivate = useCallback((record) => {
    const activeMappings = record._count?.mappings ?? 0;
    if (activeMappings > 0) {
      Modal.warning({
        title: 'Cannot Deactivate — Active Mappings Exist',
        content: (
          <div>
            <p>
              <strong>{record.product_name}</strong> is currently mapped to{' '}
              <strong>{activeMappings} active company mapping{activeMappings !== 1 ? 's' : ''}</strong>.
            </p>
            <p style={{ color: '#8c8c8c', marginTop: 8 }}>
              You must deactivate or remove all mappings before deactivating this product.
              Go to the <strong>Mapping</strong> page to manage them.
            </p>
          </div>
        ),
        okText: 'Understood',
        icon: <WarningFilled style={{ color: '#faad14' }} />,
      });
      return;
    }
    Modal.confirm({
      title: 'Deactivate this product?',
      content: `"${record.product_name}" will be set to INACTIVE.`,
      okText: 'Deactivate',
      okType: 'danger',
      onOk: () => deactivate(record.product_id),
    });
  }, [deactivate]);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to update product');
          }
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
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to create product');
          }
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
    { title: 'Status', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions', width: 220,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="products" action="can_view">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(record.product_id)}>View</Button>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Button size="small" danger icon={<StopOutlined />} onClick={() => handleDeactivate(record)}>Deactivate</Button>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.product_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ], [handleEdit, handleDeactivate, reactivate]);

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
        options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
                Add Product
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Input.Search
          placeholder="Search by name, SKU, CAS, or mapped company..."
          allowClear
          onSearch={handleSearch}
          style={{ width: 350 }}
          prefix={<SearchOutlined />}
        />
        <Space>
          {filterBar}
          <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
        </Space>
      </Space>

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