import { useState, useEffect, useMemo, useCallback } from 'react';
import './MappingPage.css';
import { Table, Button, Space, Select, Tag, Form, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import MappingViewDrawer from '../../components/MappingViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useMappings, useMapping,
  useCreateMapping, useUpdateMapping,
  useDeactivateMapping, useReactivateMapping, useDeleteMapping,
  useCompanyOptions, useProductOptions
} from '../../api/mappingsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';
import useDebounce from '../../hooks/useDebounce'
const ROLE_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER', label: 'Supplier', color: 'green' },
  { value: 'DISTRIBUTOR', label: 'Distributor', color: 'purple' },
];

function MappingPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: listData, isLoading } = useMappings({
    page, company_id: filterCompany, product_id: filterProduct,
    role_type: filterRole, status: filterActive
  });
  const { data: editData } = useMapping(editingId);
  const { data: companyOptions } = useCompanyOptions();
  const { data: productOptions } = useProductOptions();
  const { mutate: create, isPending: creating } = useCreateMapping();
  const { mutate: update, isPending: updating } = useUpdateMapping();
  const { mutate: deactivate } = useDeactivateMapping();
  const { mutate: reactivate } = useReactivateMapping();
  const { mutate: deleteMapping } = useDeleteMapping();
  const { applyServerErrors } = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue({
        ...editData,
        moq: editData.moq ? Number(editData.moq) : null,
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
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); },
        onError: (err) => {
          applyServerErrors(err);
          if (err?.response?.status === 409) {
            form.setFields([
              { name: 'product_id', errors: ['This mapping already exists for this company.'] },
              { name: 'role_type', errors: ['This mapping already exists for this company.'] }
            ]);
          }
        }
      });
    }
  }, [editingId, update, create, form, applyServerErrors]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMapping(deleteTarget.mapping_id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  }, [deleteMapping, deleteTarget]);

  const handleCompanyFilter = useCallback((v) => { setFilterCompany(v || ''); setPage(1); }, []);
  const handleProductFilter = useCallback((v) => { setFilterProduct(v || ''); setPage(1); }, []);
  const handleRoleFilter = useCallback((v) => { setFilterRole(v || ''); setPage(1); }, []);
  const handleActiveFilter = useCallback((v) => { setFilterActive(v !== undefined && v !== null ? v : ''); setPage(1); }, []);

  const allColumns = useMemo(() => [
    { title: 'Company', key: 'company', width: 200, render: (_, r) => r.company?.company_name || '—' },
    { title: 'Product', key: 'product', width: 200, render: (_, r) => `${r.product?.product_name || '—'} (${r.product?.sku || ''})` },
    {
      title: 'Role', key: 'role_type', width: 130,
      render: (_, r) => {
        const t = ROLE_TYPES.find(rt => rt.value === r.role_type);
        return <Tag color={t?.color}>{t?.label || r.role_type}</Tag>;
      }
    },
    { title: 'MOQ', key: 'moq', width: 100, render: (_, r) => r.moq ? Number(r.moq).toLocaleString() : '—' },
    {
      title: 'Price Range', key: 'price', width: 150,
      render: (_, r) => {
        if (!r.price_range_min && !r.price_range_max) return '—';
        const min = r.price_range_min ? `₹${Number(r.price_range_min).toLocaleString()}` : '';
        const max = r.price_range_max ? `₹${Number(r.price_range_max).toLocaleString()}` : '';
        return `${min} – ${max}`;
      }
    },
    { title: 'Lead Time', key: 'lead_time_days', width: 100, render: (_, r) => r.lead_time_days ? `${r.lead_time_days} days` : '—' },
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        const actionLabel = isActive ? 'Deactivate' : isInactive ? 'Reactivate' : null;

        if (!actionLabel) return <StatusBadge status={record.status_flag} />;

        return (
          <PermissionGuard module="mappings" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this mapping?`}
              description={`Mapping will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`}
              onConfirm={() =>
                isActive
                  ? deactivate(record.mapping_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }) })
                  : reactivate(record.mapping_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }) })
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
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="mappings" action="can_view">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(record.mapping_id)}>View</Button>
          </PermissionGuard>
          <PermissionGuard module="mappings" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="mappings" action="can_delete">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(record)}>
              Delete
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ], [handleEdit, deactivate, reactivate]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  const formFields = useMemo(() => (
    <>
      <Form.Item name="moq" label="Minimum Order Quantity (MOQ)" rules={[
        { type: 'number', min: 0.01, message: 'MOQ must be greater than 0' },
        { type: 'number', max: 999999999, message: 'MOQ value is too large' },
      ]}>
        <InputNumber className="mapping-input-full" min={0.01} step={0.01} placeholder="e.g. 500" />
      </Form.Item>
      <Form.Item name="price_range_min" label="Price Range Min (₹)" rules={[
        { type: 'number', min: 0, message: 'Minimum price cannot be negative' },
      ]}>
        <InputNumber className="mapping-input-full" min={0} step={0.01} placeholder="e.g. 120.00" />
      </Form.Item>
      <Form.Item name="price_range_max" label="Price Range Max (₹)" dependencies={['price_range_min']} rules={[
        { type: 'number', min: 0, message: 'Maximum price cannot be negative' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            const min = getFieldValue('price_range_min');
            if (!value || !min || value >= min) return Promise.resolve();
            return Promise.reject(new Error('Max price must be ≥ min price'));
          },
        }),
      ]}>
        <InputNumber className="mapping-input-full" min={0} step={0.01} placeholder="e.g. 150.00" />
      </Form.Item>
      <Form.Item name="lead_time_days" label="Lead Time (Days)" rules={[
        { type: 'number', min: 1, message: 'Lead time must be at least 1 day' },
        { type: 'number', max: 3650, message: 'Lead time cannot exceed 3650 days' },
        { type: 'integer', message: 'Lead time must be a whole number' },
      ]}>
        <InputNumber className="mapping-input-full" min={1} max={3650} step={1} precision={0} placeholder="e.g. 14" />
      </Form.Item>
      <Form.Item name="status_flag" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
        <Select options={[
          { value: 0, label: 'Active' },
          { value: 2, label: 'Inactive' }
        ]} />
      </Form.Item>
    </>
  ), []);

  return (
    <div>
      <PageHeader
        title="Company Product Mapping"
        subtitle="Manage company-product relationships"
        breadcrumbs={['Mappings']}
        extra={
          <PermissionGuard module="mappings" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
              Add Mapping
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mapping-toolbar">
        <Select placeholder="Company" allowClear showSearch optionFilterProp="label"
          className="mapping-filter-company"
          value={filterCompany || undefined} onChange={handleCompanyFilter}
          options={companyOptions || []}
        />
        <Select placeholder="Product" allowClear showSearch optionFilterProp="label"
          className="mapping-filter-product"
          value={filterProduct || undefined} onChange={handleProductFilter}
          options={productOptions || []}
        />
        <Select placeholder="Role Type" allowClear className="mapping-filter-role"
          value={filterRole || undefined} onChange={handleRoleFilter}
          options={ROLE_TYPES}
        />
        <Select placeholder="Status" allowClear className="mapping-filter-status"
          value={filterActive === '' ? undefined : filterActive} onChange={handleActiveFilter}
          options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]}
        />
        <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="mapping_id"
        pagination={{
          current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} mappings`, onChange: setPage,
        }}
        size="middle"
      />

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Mapping' : 'Add Mapping'}
        loading={creating || updating} width={600} form={form}
      >
        {!editingId && (
          <>
            <Form.Item name="company_id" label="Company" rules={[{ required: true, message: 'Select a company' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Search company..."
                options={companyOptions || []}
              />
            </Form.Item>
            <Form.Item name="product_id" label="Product" rules={[{ required: true, message: 'Select a product' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Search product..."
                options={productOptions || []}
              />
            </Form.Item>
            <Form.Item name="role_type" label="Role Type" rules={[{ required: true }]}>
              <Select options={ROLE_TYPES} />
            </Form.Item>
          </>
        )}
        {editingId && (
          <div className="mapping-edit-info">
            <p><strong>Company:</strong> {editData?.company?.company_name}</p>
            <p><strong>Product:</strong> {editData?.product?.product_name} ({editData?.product?.sku})</p>
            <p><strong>Role:</strong> {editData?.role_type}</p>
          </div>
        )}
        {formFields}
      </FormModal>

      <MappingViewDrawer open={!!viewId} mappingId={viewId} onClose={() => setViewId(null)} />

      {/* Delete Confirmation Modal */}
      <FormModal
        open={!!deleteTarget}
        title="Permanently delete this mapping?"
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDeleteConfirm}
        okText="Delete"
        okType="danger"
      >
        {deleteTarget && (
          <p>
            <strong>{deleteTarget.company?.company_name} - {deleteTarget.product?.product_name}</strong> will be permanently removed.
            This action cannot be undone.
          </p>
        )}
      </FormModal>
    </div>
  );
}

export default MappingPage;