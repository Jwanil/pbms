import { useState, useEffect } from 'react';
import { Table, Button, Space, Select, Tag, Form, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import MappingViewDrawer from '../../components/MappingViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useMappings, useMapping,
  useCreateMapping, useUpdateMapping,
  useDeactivateMapping, useReactivateMapping,
  useCompanyOptions, useProductOptions
} from '../../api/mappingsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';

const ROLE_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER', label: 'Supplier', color: 'green' },
  { value: 'DISTRIBUTOR', label: 'Distributor', color: 'purple' },
];

function MappingPage() {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);

  const { data: listData, isLoading } = useMappings({
    page, company_id: filterCompany, product_id: filterProduct,
    role_type: filterRole, is_active: filterActive
  });
  const { data: editData } = useMapping(editingId);
  const { data: companyOptions } = useCompanyOptions();
  const { data: productOptions } = useProductOptions();
  const { mutate: create, isPending: creating } = useCreateMapping();
  const { mutate: update, isPending: updating } = useUpdateMapping();
  const { mutate: deactivate } = useDeactivateMapping();
  const { mutate: reactivate } = useReactivateMapping();
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

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.mapping_id);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingId) {
      // Only send updatable fields
      const { moq, price_range_min, price_range_max, lead_time_days } = values;
      update({ id: editingId, data: { moq, price_range_min, price_range_max, lead_time_days } }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to update mapping');
          }
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
          } else if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to create mapping');
          }
        }
      });
    }
  };

  const allColumns = [
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
      title: 'Active', key: 'is_active', width: 80, align: 'center',
      render: (_, r) => <Tag color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Yes' : 'No'}</Tag>
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
            {record.is_active ? (
              <Popconfirm title="Deactivate this mapping?" onConfirm={() => deactivate(record.mapping_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.mapping_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  return (
    <div>
      <PageHeader
        title="Company Product Mapping"
        subtitle="Manage company-product relationships"
        breadcrumbs={['Mappings']}
        extra={
          <PermissionGuard module="mappings" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
              Add Mapping
            </Button>
          </PermissionGuard>
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="Company" allowClear showSearch optionFilterProp="label"
          style={{ width: 220 }}
          value={filterCompany || undefined} onChange={(v) => { setFilterCompany(v || ''); setPage(1); }}
          options={companyOptions || []}
        />
        <Select placeholder="Product" allowClear showSearch optionFilterProp="label"
          style={{ width: 220 }}
          value={filterProduct || undefined} onChange={(v) => { setFilterProduct(v || ''); setPage(1); }}
          options={productOptions || []}
        />
        <Select placeholder="Role Type" allowClear style={{ width: 150 }}
          value={filterRole || undefined} onChange={(v) => { setFilterRole(v || ''); setPage(1); }}
          options={ROLE_TYPES}
        />
        <Select placeholder="Status" allowClear style={{ width: 120 }}
          value={filterActive || undefined} onChange={(v) => { setFilterActive(v !== undefined ? v : ''); setPage(1); }}
          options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
        />
        <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
      </Space>

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
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ margin: 0 }}><strong>Company:</strong> {editData?.company?.company_name}</p>
            <p style={{ margin: 0 }}><strong>Product:</strong> {editData?.product?.product_name} ({editData?.product?.sku})</p>
            <p style={{ margin: 0 }}><strong>Role:</strong> {editData?.role_type}</p>
          </div>
        )}
        <Form.Item name="moq" label="Minimum Order Quantity (MOQ)" rules={[
          { type: 'number', min: 0.01, message: 'MOQ must be greater than 0' },
          { type: 'number', max: 999999999, message: 'MOQ value is too large' },
        ]}>
          <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} placeholder="e.g. 500" />
        </Form.Item>
        <Form.Item name="price_range_min" label="Price Range Min (₹)" rules={[
          { type: 'number', min: 0, message: 'Minimum price cannot be negative' },
        ]}>
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="e.g. 120.00" />
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
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="e.g. 150.00" />
        </Form.Item>
        <Form.Item name="lead_time_days" label="Lead Time (Days)" rules={[
          { type: 'number', min: 1, message: 'Lead time must be at least 1 day' },
          { type: 'number', max: 3650, message: 'Lead time cannot exceed 3650 days' },
          { type: 'integer', message: 'Lead time must be a whole number' },
        ]}>
          <InputNumber style={{ width: '100%' }} min={1} max={3650} step={1} precision={0} placeholder="e.g. 14" />
        </Form.Item>
      </FormModal>

      <MappingViewDrawer open={!!viewId} mappingId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}

export default MappingPage;