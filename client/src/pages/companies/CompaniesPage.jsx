import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Space, Input, Select, Form, Tabs, InputNumber, Modal, Row, Col, Divider, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, WarningFilled } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import CompanyViewDrawer from '../../components/CompanyViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import LocationFields from '../../components/LocationFields';
import {
  useCompanies, useCompany,
  useCreateCompany, useUpdateCompany,
  useDeactivateCompany, useReactivateCompany
} from '../../api/companiesApi';
import { useUploadDocument } from '../../api/documentsApi';
import useFormErrors from '../../hooks/useFormErrors';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { message } from 'antd';

const COMPANY_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', color: 'blue' },
  { value: 'SUPPLIER', label: 'Supplier', color: 'green' },
  { value: 'BUYER', label: 'Buyer', color: 'orange' },
  { value: 'DISTRIBUTOR', label: 'Distributor', color: 'purple' },
];

function CompaniesPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  // Controlled deactivate modals (antd v5 recommended pattern)
  const [deactivateTarget, setDeactivateTarget] = useState(null);    // record to confirm-deactivate
  const [mappingBlockTarget, setMappingBlockTarget] = useState(null); // record blocked due to mappings

  const { data: listData, isLoading } = useCompanies({ page, search, company_type: filterType, status: filterStatus });
  const { data: editData } = useCompany(editingId);
  const { mutate: create, isPending: creating } = useCreateCompany();
  const { mutate: update, isPending: updating } = useUpdateCompany();
  const { mutate: deactivate, isPending: deactivating } = useDeactivateCompany();
  const { mutate: reactivate } = useReactivateCompany();
  const { mutateAsync: uploadDoc } = useUploadDocument();
  const { applyServerErrors } = useFormErrors(form);

  useEffect(() => {
    if (editData && editingId) {
      form.setFieldsValue({ ...editData, branches: editData.branches || [] });
    }
  }, [editData, editingId, form]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ branches: [] });
    setUploadFiles([]);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record) => {
    setEditingId(record.company_id);
    setModalOpen(true);
  }, []);

  const handleDeactivateClick = useCallback((record) => {
    const activeMappings = record._count?.mappings ?? 0;
    if (activeMappings > 0) {
      setMappingBlockTarget(record);
    } else {
      setDeactivateTarget(record);
    }
  }, []);

  const handleDeactivateConfirm = useCallback(() => {
    if (!deactivateTarget) return;
    deactivate(deactivateTarget.company_id, {
      onSuccess: () => setDeactivateTarget(null),
      onError: () => setDeactivateTarget(null),
    });
  }, [deactivate, deactivateTarget]);

  const handleSubmit = useCallback((values) => {
    if (editingId) {
      update({ id: editingId, data: values }, {
        onSuccess: () => { setModalOpen(false); setEditingId(null); },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to update company');
          }
        },
      });
    } else {
      create(values, {
        onSuccess: async (res) => {
          const companyId = res?.data?.data?.company_id;
          if (companyId && uploadFiles.length > 0) {
            for (let file of uploadFiles) {
              const fd = new FormData();
              fd.append('file', file.originFileObj || file);
              fd.append('entity_type', 'COMPANY');
              fd.append('entity_id', companyId);
              try { await uploadDoc(fd); } catch { /* ignore */ }
            }
          }
          setModalOpen(false);
          setUploadFiles([]);
        },
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to create company');
          }
        },
      });
    }
  }, [editingId, update, create, uploadFiles, uploadDoc, applyServerErrors]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  }, [queryClient]);

  const handleSearch = useCallback((v) => { setSearch(v); setPage(1); }, []);
  const handleTypeFilter = useCallback((v) => { setFilterType(v || ''); setPage(1); }, []);
  const handleStatusFilter = useCallback((v) => { setFilterStatus(v || ''); setPage(1); }, []);

  const allColumns = useMemo(() => [
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name', width: 200 },
    {
      title: 'Type', key: 'company_type', width: 130,
      render: (_, r) => {
        const t = COMPANY_TYPES.find(ct => ct.value === r.company_type);
        return <Tag color={t?.color}>{t?.label || r.company_type}</Tag>;
      },
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: 'GST', dataIndex: 'gst_number', key: 'gst', width: 160 },
    { title: 'Branches', key: 'branches', width: 80, align: 'center', render: (_, r) => r._count?.branches || 0 },
    { title: 'Status', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions', width: 220,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="companies" action="can_view">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(record.company_id)}>View</Button>
          </PermissionGuard>
          <PermissionGuard module="companies" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="companies" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Button size="small" danger icon={<StopOutlined />} onClick={() => handleDeactivateClick(record)}>
                Deactivate
              </Button>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(record.company_id)}>
                Reactivate
              </Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ], [handleEdit, handleDeactivateClick, reactivate]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  const formTabs = useMemo(() => [
    {
      key: 'details',
      label: 'Company Details',
      children: (
        <Row gutter={16}>
          <Col span={12}><Form.Item name="company_name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="company_type" label="Company Type" rules={[{ required: true }]}>
              <Select options={COMPANY_TYPES} />
            </Form.Item>
          </Col>
          <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item></Col>
          <LocationFields namePrefix={[]} colSpan={8} />
          <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="phone" label="Phone" rules={[{ pattern: /^[0-9]{10,15}$/, message: 'Must be 10-15 digits' }]}><Input /></Form.Item></Col>
          <Col span={8}><Form.Item name="gst_number" label="GST Number"><Input maxLength={15} /></Form.Item></Col>
          <Col span={8}><Form.Item name="pan_number" label="PAN Number"><Input maxLength={10} /></Form.Item></Col>
          <Col span={8}><Form.Item name="cin_number" label="CIN Number"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="website" label="Website"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="industry_type" label="Industry Type"><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item></Col>
          {!editingId && (
            <Col span={24}>
              <Divider style={{ margin: '12px 0' }} />
              <Form.Item label="Initial Documents">
                <Input type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files))} />
              </Form.Item>
            </Col>
          )}
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
                    <LocationFields restField={restField} namePrefix={[name]} />
                    <Col span={8}><Form.Item {...restField} name={[name, 'pincode']} label="Pincode"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'contact_number']} label="Contact Number" rules={[{ pattern: /^[0-9]{10,15}$/, message: 'Must be 10-15 digits' }]}><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'email']} label="Email" rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item></Col>
                    <Col span={4}><Form.Item {...restField} name={[name, 'latitude']} label="Latitude" rules={[{ type: 'number', min: -90, max: 90 }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={4}><Form.Item {...restField} name={[name, 'longitude']} label="Longitude" rules={[{ type: 'number', min: -180, max: 180 }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
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
  ], [editingId]);

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Manage manufacturers, suppliers, buyers and distributors"
        breadcrumbs={['Companies']}
        extra={
          <Space>
            <ExportCsvButton module="companies" moduleName="Companies" />
            <PermissionGuard module="companies" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="companies" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#1F3A6E' }}>
                Add Company
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Input.Search
          placeholder="Search by name, email, GST, or mapped product..."
          allowClear
          onSearch={handleSearch}
          style={{ width: 350 }}
        />
        <Space>
          <Select placeholder="Company Type" allowClear style={{ width: 160 }}
            value={filterType || undefined} onChange={handleTypeFilter}
            options={COMPANY_TYPES}
          />
          <Select placeholder="Status" allowClear style={{ width: 120 }}
            value={filterStatus || undefined} onChange={handleStatusFilter}
            options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
          />
          <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
        </Space>
      </Space>

      <Table
        columns={visibleColumns}
        dataSource={listData?.data || []}
        loading={isLoading}
        rowKey="company_id"
        pagination={{
          current: page,
          total: listData?.pagination?.total || 0,
          pageSize: 20,
          showSizeChanger: false,
          showTotal: (t) => `Total ${t} companies`,
          onChange: setPage,
        }}
        size="middle"
      />

      {/* ── Controlled: Mapping-block warning ── */}
      <Modal
        open={!!mappingBlockTarget}
        title={
          <span>
            <WarningFilled style={{ color: '#faad14', marginRight: 8 }} />
            Cannot Deactivate — Active Mappings Exist
          </span>
        }
        onOk={() => setMappingBlockTarget(null)}
        onCancel={() => setMappingBlockTarget(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Understood"
      >
        {mappingBlockTarget && (
          <div>
            <p>
              <strong>{mappingBlockTarget.company_name}</strong> has{' '}
              <strong>{mappingBlockTarget._count?.mappings} active product mapping{mappingBlockTarget._count?.mappings !== 1 ? 's' : ''}</strong>.
            </p>
            <p style={{ color: '#8c8c8c', marginTop: 8 }}>
              You must deactivate or remove all mappings before deactivating this company.
              Go to the <strong>Mapping</strong> page to manage them.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Controlled: Deactivate confirm ── */}
      <Modal
        open={!!deactivateTarget}
        title="Deactivate this company?"
        onOk={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
        okText="Deactivate"
        okType="danger"
        confirmLoading={deactivating}
      >
        {deactivateTarget && (
          <p>
            <strong>"{deactivateTarget.company_name}"</strong> and all its active mappings will be set to INACTIVE.
          </p>
        )}
      </Modal>

      <FormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Company' : 'Add Company'}
        loading={creating || updating}
        width={800}
        form={form}
      >
        <Tabs items={formTabs} />
      </FormModal>

      <CompanyViewDrawer open={!!viewId} companyId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module="companies"
        moduleName="Companies"
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default CompaniesPage;