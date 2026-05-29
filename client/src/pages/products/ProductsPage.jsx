import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Tag, Form, Tabs, InputNumber, Popconfirm, Spin } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useProducts, useProduct, useProductFormData,
  useCreateProduct, useUpdateProduct,
  useDeactivateProduct, useReactivateProduct
} from '../../api/productsApi';

function ProductsPage() {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: listData, isLoading } = useProducts({ page, search, category_id: filterCategory, grade_id: filterGrade, status: filterStatus });
  const { data: editData } = useProduct(editingId);
  const { data: formData } = useProductFormData();
  const { mutate: create, isPending: creating } = useCreateProduct();
  const { mutate: update, isPending: updating } = useUpdateProduct();
  const { mutate: deactivate } = useDeactivateProduct();
  const { mutate: reactivate } = useReactivateProduct();

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue(editData);
    }
  }, [editData, editingId, form]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.product_id);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); }
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); }
      });
    }
  };

  const columns = [
    { title: 'Product Name', dataIndex: 'product_name', key: 'product_name', width: 200 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'CAS Number', dataIndex: 'cas_number', key: 'cas_number', width: 130 },
    { title: 'Category', key: 'category', width: 130, render: (_, r) => r.category?.category_name || '—' },
    { title: 'Grade', key: 'grade', width: 100, render: (_, r) => r.grade?.grade_name || '—' },
    { title: 'UOM', dataIndex: 'unit_of_measure', key: 'uom', width: 70 },
    { title: 'Status', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionGuard module="products" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Popconfirm title="Deactivate this product?" onConfirm={() => deactivate(record.product_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.product_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const filterBar = (
    <Space wrap>
      <Select
        placeholder="Category" allowClear style={{ width: 160 }}
        value={filterCategory || undefined} onChange={(v) => { setFilterCategory(v || ''); setPage(1); }}
        options={(formData?.categories || []).map(c => ({ value: c.category_id, label: c.category_name }))}
      />
      <Select
        placeholder="Grade" allowClear style={{ width: 140 }}
        value={filterGrade || undefined} onChange={(v) => { setFilterGrade(v || ''); setPage(1); }}
        options={(formData?.grades || []).map(g => ({ value: g.grade_id, label: g.grade_name }))}
      />
      <Select
        placeholder="Status" allowClear style={{ width: 120 }}
        value={filterStatus || undefined} onChange={(v) => { setFilterStatus(v || ''); setPage(1); }}
        options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
      />
    </Space>
  );

  const formTabs = [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <>
          <Form.Item name="product_name" label="Product Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="composition" label="Composition">
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Category">
            <Select allowClear placeholder="Select category"
              options={(formData?.categories || []).map(c => ({ value: c.category_id, label: c.category_name }))}
            />
          </Form.Item>
          <Form.Item name="grade_id" label="Grade">
            <Select allowClear placeholder="Select grade"
              options={(formData?.grades || []).map(g => ({ value: g.grade_id, label: g.grade_name }))}
            />
          </Form.Item>
          <Form.Item name="packaging_id" label="Packaging">
            <Select allowClear placeholder="Select packaging"
              options={(formData?.packaging || []).map(p => ({ value: p.packaging_id, label: `${p.packaging_name} (${p.size_value} ${p.size_unit})` }))}
            />
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
      key: 'chemical',
      label: 'Chemical Data',
      children: (
        <>
          <Form.Item name="molecular_formula" label="Molecular Formula"><Input /></Form.Item>
          <Form.Item name="molecular_weight" label="Molecular Weight"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="purity" label="Purity (%)" rules={[{ type: 'number', min: 0, max: 100 }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="cas_number" label="CAS Number"><Input /></Form.Item>
          <Form.Item name="un_number" label="UN Number"><Input /></Form.Item>
          <Form.Item name="process_type" label="Process Type"><Input /></Form.Item>
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
        </>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage product catalog"
        breadcrumbs={['Products']}
        extra={
          <PermissionGuard module="products" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
              Add Product
            </Button>
          </PermissionGuard>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Input.Search
          placeholder="Search by name, SKU, or CAS..."
          allowClear
          onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        {filterBar}
      </Space>

      <Table
        columns={columns}
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
        scroll={{ x: 'max-content' }}
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
    </div>
  );
}

export default ProductsPage;