import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Tag, Form, Tabs, Popconfirm, Spin, Card, Row, Col, Divider } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useCompanies, useCompany,
  useCreateCompany, useUpdateCompany,
  useDeactivateCompany, useReactivateCompany
} from '../../api/companiesApi';

const COMPANY_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER', label: 'Supplier', color: 'green' },
  { value: 'BUYER', label: 'Buyer', color: 'orange' },
  { value: 'DISTRIBUTOR', label: 'Distributor', color: 'purple' },
];

function CompaniesPage() {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: listData, isLoading } = useCompanies({ page, search, company_type: filterType, status: filterStatus });
  const { data: editData } = useCompany(editingId);
  const { mutate: create, isPending: creating } = useCreateCompany();
  const { mutate: update, isPending: updating } = useUpdateCompany();
  const { mutate: deactivate } = useDeactivateCompany();
  const { mutate: reactivate } = useReactivateCompany();

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue({
        ...editData,
        branches: editData.branches || [],
      });
    }
  }, [editData, editingId, form]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ branches: [] });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.company_id);
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
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name', width: 200 },
    {
      title: 'Type', key: 'company_type', width: 130,
      render: (_, r) => {
        const t = COMPANY_TYPES.find(ct => ct.value === r.company_type);
        return <Tag color={t?.color}>{t?.label || r.company_type}</Tag>;
      }
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: 'GST', dataIndex: 'gst_number', key: 'gst', width: 160 },
    { title: 'Branches', key: 'branches', width: 80, align: 'center', render: (_, r) => r._count?.branches || 0 },
    { title: 'Status', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionGuard module="companies" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="companies" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Popconfirm title="Deactivate this company and all its mappings?" onConfirm={() => deactivate(record.company_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.company_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const formTabs = [
    {
      key: 'details',
      label: 'Company Details',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="company_name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="company_type" label="Company Type" rules={[{ required: true }]}>
              <Select options={COMPANY_TYPES} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          </Col>
          <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
          <Col span={8}><Form.Item name="gst_number" label="GST Number"><Input maxLength={15} /></Form.Item></Col>
          <Col span={8}><Form.Item name="pan_number" label="PAN Number"><Input maxLength={10} /></Form.Item></Col>
          <Col span={8}><Form.Item name="cin_number" label="CIN Number"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="website" label="Website"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="industry_type" label="Industry Type"><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item></Col>
        </Row>
      ),
    },
    {
      key: 'branches',
      label: 'Branches',
      children: (
        <Form.List name="branches">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} size="small" style={{ marginBottom: 12 }}
                  extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
                  title={`Branch ${name + 1}`}
                >
                  <Row gutter={12}>
                    <Col span={12}><Form.Item {...restField} name={[name, 'branch_name']} label="Branch Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'gst_number']} label="GST"><Input maxLength={15} /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'address_line1']} label="Address Line 1"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'address_line2']} label="Address Line 2"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'city']} label="City"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'state']} label="State"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'pincode']} label="Pincode"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'contact_number']} label="Contact Number"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'email']} label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
                  </Row>
                  <Form.Item {...restField} name={[name, 'branch_id']} hidden><Input /></Form.Item>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Branch</Button>
            </>
          )}
        </Form.List>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Manage manufacturers, suppliers, buyers and distributors"
        breadcrumbs={['Companies']}
        extra={
          <PermissionGuard module="companies" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
              Add Company
            </Button>
          </PermissionGuard>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Input.Search
          placeholder="Search by name, GST, or email..."
          allowClear onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 300 }} prefix={<SearchOutlined />}
        />
        <Space>
          <Select placeholder="Company Type" allowClear style={{ width: 160 }}
            value={filterType || undefined} onChange={(v) => { setFilterType(v || ''); setPage(1); }}
            options={COMPANY_TYPES}
          />
          <Select placeholder="Status" allowClear style={{ width: 120 }}
            value={filterStatus || undefined} onChange={(v) => { setFilterStatus(v || ''); setPage(1); }}
            options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
          />
        </Space>
      </Space>

      <Table
        columns={columns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="company_id"
        pagination={{
          current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} companies`, onChange: setPage,
        }}
        scroll={{ x: 'max-content' }} size="middle"
      />

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Company' : 'Add Company'}
        loading={creating || updating} width={800} form={form}
      >
        <Tabs items={formTabs} />
      </FormModal>
    </div>
  );
}

export default CompaniesPage;