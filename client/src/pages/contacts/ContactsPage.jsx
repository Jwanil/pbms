import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, Tag, Form, Tabs, Popconfirm, Row, Col, Divider } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useContacts, useContact,
  useCreateContact, useUpdateContact,
  useDeactivateContact, useReactivateContact,
  useCompanyOptions, useProductOptions, useBranchesByCompany
} from '../../api/contactsApi';
import useFormErrors from '../../hooks/useFormErrors';
import { message } from 'antd';

const CONTACT_TYPES = [
  { value: 'BUYER', label: 'Buyer', color: 'orange' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager', color: 'blue' },
  { value: 'SALES', label: 'Sales', color: 'green' },
  { value: 'ADMIN', label: 'Admin', color: 'purple' },
];

const LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'HINDI', label: 'Hindi' },
  { value: 'REGIONAL', label: 'Regional' },
];

function ContactsPage() {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const { data: listData, isLoading } = useContacts({
    page, search, contact_type: filterType, preferred_language: filterLang,
    product_id: filterProduct, status: filterStatus
  });
  const { data: editData } = useContact(editingId);
  const { data: companyOptions } = useCompanyOptions();
  const { data: productOptions } = useProductOptions();
  const { data: branchOptions } = useBranchesByCompany(selectedCompanyId);
  const { mutate: create, isPending: creating } = useCreateContact();
  const { mutate: update, isPending: updating } = useUpdateContact();
  const { mutate: deactivate } = useDeactivateContact();
  const { mutate: reactivate } = useReactivateContact();

  const { applyServerErrors } = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      const tags = editData.tags ? JSON.parse(editData.tags) : [];
      const product_ids = (editData.interests || []).map(i => i.product_id);
      form.setFieldsValue({
        ...editData,
        tags,
        product_ids,
      });
      setSelectedCompanyId(editData.company_id || null);
    }
  }, [editData, editingId, form]);

  const handleAdd = () => {
    setEditingId(null);
    setSelectedCompanyId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.contact_id);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); setSelectedCompanyId(null); },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to update contact');
          }
        }
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); setSelectedCompanyId(null); },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to create contact');
          }
        }
      });
    }
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompanyId(companyId || null);
    form.setFieldValue('branch_id', null); // Reset branch when company changes
  };

  const columns = [
    { title: 'Name', key: 'name', width: 180, render: (_, r) => `${r.first_name} ${r.last_name || ''}`.trim() },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile', width: 130 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Company', key: 'company', width: 160, render: (_, r) => r.company?.company_name || '—' },
    {
      title: 'Type', key: 'contact_type', width: 140,
      render: (_, r) => {
        const t = CONTACT_TYPES.find(ct => ct.value === r.contact_type);
        return r.contact_type ? <Tag color={t?.color}>{t?.label || r.contact_type}</Tag> : '—';
      }
    },
    {
      title: 'Tags', key: 'tags', width: 160,
      render: (_, r) => {
        if (!r.tags) return '—';
        try {
          const parsed = JSON.parse(r.tags);
          return parsed.map(tag => <Tag key={tag}>{tag}</Tag>);
        } catch { return '—'; }
      }
    },
    { title: 'Interests', key: 'interests', width: 80, align: 'center', render: (_, r) => r._count?.interests || 0 },
    { title: 'Status', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="contacts" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="contacts" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Popconfirm title="Deactivate this contact?" onConfirm={() => deactivate(record.contact_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.contact_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const formTabs = [
    {
      key: 'basic',
      label: 'Contact Details',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_name" label="Last Name"><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mobile" label="Mobile" rules={[
              { required: true, message: 'Mobile number is required' },
              { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid mobile number' }
            ]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="alternate_mobile" label="Alternate Mobile" dependencies={['mobile']} rules={[
              { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid phone number' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const mobile = getFieldValue('mobile');
                  if (mobile && value.replace(/\s/g,'') === mobile.replace(/\s/g,'')) {
                    return Promise.reject(new Error('Must be different from primary mobile'));
                  }
                  return Promise.resolve();
                }
              })
            ]}><Input placeholder="+91 98765 43210" /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="designation" label="Designation"><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contact_type" label="Contact Type">
              <Select allowClear options={CONTACT_TYPES} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="preferred_language" label="Preferred Language">
              <Select allowClear options={LANGUAGES} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'company',
      label: 'Company & Branch',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="company_id" label="Company">
              <Select allowClear showSearch optionFilterProp="label"
                placeholder="Select company..."
                options={companyOptions || []}
                onChange={handleCompanyChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="branch_id" label="Branch">
              <Select allowClear showSearch optionFilterProp="label"
                placeholder={selectedCompanyId ? 'Select branch...' : 'Select company first'}
                disabled={!selectedCompanyId}
                options={branchOptions || []}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'interests',
      label: 'Product Interests & Tags',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="product_ids" label="Product Interests">
              <Select mode="multiple" showSearch optionFilterProp="label"
                placeholder="Select products this contact is interested in..."
                options={productOptions || []}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder='Type and press Enter (e.g. "Bulk Buyer", "High Priority")' />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Manage buyer and company contacts"
        breadcrumbs={['Contacts']}
        extra={
          <PermissionGuard module="contacts" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
              Add Contact
            </Button>
          </PermissionGuard>
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search by name, mobile, or email..."
          allowClear onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 280 }} prefix={<SearchOutlined />}
        />
        <Select placeholder="Contact Type" allowClear style={{ width: 170 }}
          value={filterType || undefined} onChange={(v) => { setFilterType(v || ''); setPage(1); }}
          options={CONTACT_TYPES}
        />
        <Select placeholder="Language" allowClear style={{ width: 130 }}
          value={filterLang || undefined} onChange={(v) => { setFilterLang(v || ''); setPage(1); }}
          options={LANGUAGES}
        />
        <Select placeholder="Product Interest" allowClear showSearch optionFilterProp="label" style={{ width: 200 }}
          value={filterProduct || undefined} onChange={(v) => { setFilterProduct(v || ''); setPage(1); }}
          options={productOptions || []}
        />
        <Select placeholder="Status" allowClear style={{ width: 120 }}
          value={filterStatus || undefined} onChange={(v) => { setFilterStatus(v || ''); setPage(1); }}
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
        />
      </Space>

      <Table
        columns={columns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="contact_id"
        pagination={{
          current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} contacts`, onChange: setPage,
        }}
        size="middle"
      />

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); setSelectedCompanyId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Contact' : 'Add Contact'}
        loading={creating || updating} width={800} form={form}
      >
        <Tabs items={formTabs} />
      </FormModal>
    </div>
  );
}

export default ContactsPage;
