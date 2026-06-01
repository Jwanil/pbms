import { useState, useEffect } from 'react';
import { Table, Button, Space, Select, Tag, Form, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useMappings, useMapping,
  useCreateMapping, useUpdateMapping,
  useDeactivateMapping, useReactivateMapping,
  useCompanyOptions, useProductOptions
} from '../../api/mappingsApi';

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
        onSuccess: () => { setModalOpen(false); setEditingId(null); }
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); }
      });
    }
  };

  const columns = [
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
      </Space>

      <Table
        columns={columns} dataSource={listData?.data || []}
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
        <Form.Item name="moq" label="Minimum Order Quantity (MOQ)">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 500" />
        </Form.Item>
        <Form.Item name="price_range_min" label="Price Range Min (₹)">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 10000" />
        </Form.Item>
        <Form.Item name="price_range_max" label="Price Range Max (₹)">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 50000" />
        </Form.Item>
        <Form.Item name="lead_time_days" label="Lead Time (Days)">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 14" />
        </Form.Item>
      </FormModal>
    </div>
  );
}

export default MappingPage;