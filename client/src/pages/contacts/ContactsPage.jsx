import { useState, useEffect, useMemo, useCallback } from 'react';
import './ContactsPage.css';
import { Table, Button, Space, Input, Select, Tag, Form, Tabs, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import ContactViewDrawer from '../../components/ContactViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import {
  useContacts, useContact,
  useCreateContact, useUpdateContact,
  useDeactivateContact, useReactivateContact, useDeleteContact,
  useCompanyOptions, useProductOptions, useBranchesByCompany
} from '../../api/contactsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';
import useDebounce  from '../../hooks/useDebounce';
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
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: listData, isLoading } = useContacts({
    page, search: debouncedSearch, contact_type: filterType, preferred_language: filterLang,
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
  const { mutate: deleteContact } = useDeleteContact();
  const { applyServerErrors } = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      const tags = editData.tags ? JSON.parse(editData.tags) : [];
      const product_ids = (editData.interests || []).map(i => i.product_id);
      form.setFieldsValue({ ...editData, tags, product_ids });
      setSelectedCompanyId(editData.company_id || null);
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setSelectedCompanyId(null);
    form.resetFields();
    form.setFieldsValue({ status_flag: 0 });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.contact_id);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); setSelectedCompanyId(null); },
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    } else {
      create(values, {
        onSuccess: () => { setModalOpen(false); setSelectedCompanyId(null); },
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    }
  }, [editingId, update, create, applyServerErrors]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  }, [queryClient]);

  const handleCompanyChange = useCallback((companyId) => {
    setSelectedCompanyId(companyId || null);
    form.setFieldValue('branch_id', null);
  }, [form]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteContact(deleteTarget.contact_id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  }, [deleteContact, deleteTarget]);

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);
  const handleTypeFilter = useCallback((v) => { setFilterType(v || ''); setPage(1); }, []);
  const handleLangFilter = useCallback((v) => { setFilterLang(v || ''); setPage(1); }, []);
  const handleProductFilter = useCallback((v) => { setFilterProduct(v || ''); setPage(1); }, []);
  const handleStatusFilter = useCallback((v) => { setFilterStatus(v || ''); setPage(1); }, []);

  const allColumns = useMemo(() => [
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
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        const actionLabel = isActive ? 'Deactivate' : isInactive ? 'Reactivate' : null;

        // If status is "deleted" (1), just show badge, no click
        if (!actionLabel) return <StatusBadge status={record.status_flag} />;

        return (
          <PermissionGuard module="contacts" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this contact?`}
              description={`Contact will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`}
              onConfirm={() =>
                isActive
                  ? deactivate(record.contact_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }) })
                  : reactivate(record.contact_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }) })
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
          <PermissionGuard module="contacts" action="can_view">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(record.contact_id)}>View</Button>
          </PermissionGuard>
          <PermissionGuard module="contacts" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="contacts" action="can_delete">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(record)}>
              Delete
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ], [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  const formTabs = useMemo(() => [
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
                  if (mobile && value.replace(/\s/g, '') === mobile.replace(/\s/g, '')) {
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
          <Col span={12}>
            <Form.Item name="status_flag" label="Status" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 0, label: 'Active' },
                  { value: 2, label: 'Inactive' },
                ]}
              />
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
  ], [companyOptions, productOptions, branchOptions, selectedCompanyId, handleCompanyChange]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Manage buyer and company contacts"
        breadcrumbs={['Contacts']}
        extra={
          <Space>
            <ExportCsvButton module="contacts" moduleName="Contacts" />
            <PermissionGuard module="contacts" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="contacts" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
                Add Contact
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div className="contacts-toolbar">
        <Input.Search
          placeholder="Search by name, mobile, or email..."
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          className="contacts-toolbar__search"
          prefix={<SearchOutlined />}
        />
        <Select placeholder="Contact Type" allowClear className="contacts-filter-type"
          value={filterType || undefined} onChange={handleTypeFilter}
          options={CONTACT_TYPES}
        />
        <Select placeholder="Language" allowClear className="contacts-filter-lang"
          value={filterLang || undefined} onChange={handleLangFilter}
          options={LANGUAGES}
        />
        <Select placeholder="Product Interest" allowClear showSearch optionFilterProp="label" className="contacts-filter-product"
          value={filterProduct || undefined} onChange={handleProductFilter}
          options={productOptions || []}
        />
        <Select placeholder="Status" allowClear className="contacts-filter-status"
          value={filterStatus === '' ? undefined : filterStatus} onChange={handleStatusFilter}
          options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]}
        />
        <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
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

      <ContactViewDrawer open={!!viewId} contactId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module="contacts"
        moduleName="Contacts"
        onImportSuccess={handleImportSuccess}
      />

      {/* Delete Confirmation Modal */}
      {/* Reusing Modal directly or wrapping it similarly */}
      <FormModal
        open={!!deleteTarget}
        title="Permanently delete this contact?"
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDeleteConfirm}
        okText="Delete"
        okType="danger"
      >
        {deleteTarget && (
          <p>
            <strong>&quot;{deleteTarget.first_name} {deleteTarget.last_name || ''}&quot;</strong> will be permanently removed.
            This action cannot be undone.
          </p>
        )}
      </FormModal>
    </div>
  );
}

export default ContactsPage;