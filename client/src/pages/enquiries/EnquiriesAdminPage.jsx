/**
 * EnquiriesAdminPage.jsx
 * Superadmin-only view: lists all incoming enquiries with user context.
 */

import { useState } from 'react';
import './Enquiries.css';
import { useNavigate } from 'react-router-dom';
import { Table, Select, Tag, Space, Button, Input, Modal, Typography, Divider } from 'antd';
import { CheckCircleOutlined, SyncOutlined, MessageOutlined, EyeOutlined, SafetyOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import UserPermissionsModal from '../../components/UserPermissionsModal';
import {
  useEnquiries, useUpdateEnquiryStatus, useRespondToEnquiry
} from '../../api/enquiryApi';
import { useCompanies } from '../../api/companiesApi';
import { useProducts } from '../../api/productsApi';
import { useMappings } from '../../api/mappingsApi';
import useDebounce  from '../../hooks/useDebounce';

const { TextArea } = Input;
const { Text } = Typography;

const MODULE_LABELS = {
  PRODUCT:    'Product',
  COMPANY:    'Company',
  MAPPING:    'Mapping',
  PERMISSION: 'Permissions',
  ROLE:       'Roles',
  MASTERS:    'Masters',
};

const MODULE_COLORS = {
  PRODUCT:    'blue',
  COMPANY:    'purple',
  MAPPING:    'cyan',
  PERMISSION: 'orange',
  ROLE:       'red',
  MASTERS:    'green',
};

const STATUS_FILTER_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'OPEN',        label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED',    label: 'Resolved' },
];

const MODULE_FILTER_OPTIONS = [
  { value: '',           label: 'All Modules' },
  { value: 'PRODUCT',    label: 'Product' },
  { value: 'COMPANY',    label: 'Company' },
  { value: 'MAPPING',    label: 'Mapping' },
  { value: 'PERMISSION', label: 'Permissions' },
  { value: 'ROLE',       label: 'Roles' },
  { value: 'MASTERS',    label: 'Masters' },
];

export default function EnquiriesAdminPage() {
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const debouncedSearch = useDebounce(search, 500); 
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterModule, setFilterModule]   = useState('');
  const [respondModal, setRespondModal]   = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [responseText, setResponseText]   = useState('');
  // State for the UserPermissionsModal (reused from UsersPage)
  const [permUserId, setPermUserId]     = useState(null);
  const [permUserName, setPermUserName] = useState('');

  const navigate = useNavigate();
  const { data: companiesData } = useCompanies({ limit: 999 });
  const { data: productsData }  = useProducts({ limit: 999 });
  const { data: mappingsData }  = useMappings({ limit: 999 });
  const { data, isLoading }     = useEnquiries({ page, status: filterStatus, module_type: filterModule, search: debouncedSearch });

  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateEnquiryStatus();
  const { mutate: respond,      isPending: responding }     = useRespondToEnquiry();

  // Opens the UserPermissionsModal for the enquiry's user,
  // passing the requested_permissions so they are pre-highlighted
  const openPermissionsForEnquiry = (record) => {
    setPermUserId(record.user_id);
    setPermUserName(record.user?.name || `User #${record.user_id}`);
    setSelectedEnquiry(record); // keep ref so we can resolve after granting
  };

  const handlePermissionsClose = () => {
    setPermUserId(null);
    setPermUserName('');
    setSelectedEnquiry(null);
  };

  const handleStatusChange = (enquiryId, nextStatus) => {
    updateStatus({ id: enquiryId, status: nextStatus });
  };

  const openRespondModal = (record) => {
    setSelectedEnquiry(record);
    setResponseText('');
    setRespondModal(true);
  };

  const handleRespond = () => {
    if (!responseText.trim() || responseText.trim().length < 5) return;
    respond(
      { id: selectedEnquiry.enquiry_id, data: { response: responseText } },
      { onSuccess: () => { setRespondModal(false); setSelectedEnquiry(null); } }
    );
  };

  const resolveReferenceName = (r) => {
    if (!r.reference_id) return '—';
    if (r.module_type === 'PRODUCT') {
      const p = productsData?.data?.find(p => p.product_id === r.reference_id);
      return p ? p.product_name : String(r.reference_id);
    }
    if (r.module_type === 'COMPANY') {
      const c = companiesData?.data?.find(c => c.company_id === r.reference_id);
      return c ? c.company_name : String(r.reference_id);
    }
    if (r.module_type === 'MAPPING') {
      const m = mappingsData?.data?.find(m => m.mapping_id === r.reference_id);
      return m ? `${m.company?.company_name} – ${m.product?.product_name}` : String(r.reference_id);
    }
    return '—';
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'enquiry_name',
      key: 'enquiry_name',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Submitted By',
      key: 'user',
      width: 220,
      render: (_, r) => (
        <div>
          <div className="enquiries-user-cell__name-row">
            <span className="enquiries-user-cell__name">{r.user?.name}</span>
            <Tag className="enquiries-user-cell__role-tag">{r.user?.role?.role_name}</Tag>
          </div>
          <div className="enquiries-user-cell__email">{r.user?.email}</div>
        </div>
      ),
    },
    {
      title: 'Module',
      key: 'module_type',
      width: 110,
      render: (_, r) => (
        <Tag color={MODULE_COLORS[r.module_type]}>
          {MODULE_LABELS[r.module_type]}
        </Tag>
      ),
    },

    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, r) => <StatusBadge status={r.status} />,
    },
    {
      title: 'Submitted',
      key: 'created_at',
      width: 110,
      render: (_, r) => r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—',
    },
    {
      title: 'Resolved',
      key: 'responded_at',
      width: 110,
      render: (_, r) => r.status === 'RESOLVED' && r.responded_at ? new Date(r.responded_at).toLocaleDateString('en-IN') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/enquiries/${record.enquiry_id}`)}
          >
            View
          </Button>
          {/* PERMISSION enquiries: open the full permissions manager with highlights */}
          {record.module_type === 'PERMISSION' && record.status !== 'RESOLVED' && (
            <Button
              size="small"
              icon={<SafetyOutlined />}
              type="primary"
              ghost
              onClick={() => openPermissionsForEnquiry(record)}
            >
              Grant
            </Button>
          )}
          {record.status === 'OPEN' && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              type="primary"
              ghost
              loading={updatingStatus}
              onClick={() => handleStatusChange(record.enquiry_id, 'IN_PROGRESS')}
            >
              Start
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <>
              <Button
                size="small"
                icon={<MessageOutlined />}
                type="primary"
                onClick={() => openRespondModal(record)}
              >
                Respond
              </Button>
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                className="btn-resolve"
                loading={updatingStatus}
                onClick={() => handleStatusChange(record.enquiry_id, 'RESOLVED')}
              >
                Resolve
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Manage all user enquiries and support requests"
        breadcrumbs={['Enquiries']}
      />

      <div className="enquiries-toolbar">
        <Input.Search
          placeholder="Search by name, email, role…"
          allowClear
          className="enquiries-toolbar__search"
          onSearch={(v) => { setSearch(v); setPage(1); }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
          className="enquiries-filter-status"
        />
        <Select
          value={filterModule}
          onChange={(v) => { setFilterModule(v); setPage(1); }}
          options={MODULE_FILTER_OPTIONS}
          className="enquiries-filter-module"
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="enquiry_id"
        scroll={{ x: 1050 }}
        size="small"
        pagination={{
          current: page,
          total: data?.pagination?.total,
          pageSize: 20,
          onChange: setPage,
        }}
      />

      <Modal
        title={selectedEnquiry ? `Respond to: ${selectedEnquiry.enquiry_name}` : 'Respond'}
        open={respondModal}
        onCancel={() => setRespondModal(false)}
        onOk={handleRespond}
        okText="Send Response"
        okButtonProps={{ loading: responding, disabled: responseText.trim().length < 5 }}
        destroyOnClose
      >
        {selectedEnquiry && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              From <strong>{selectedEnquiry.user?.name}</strong> ({selectedEnquiry.user?.email})
            </Text>
          </div>
        )}
        {selectedEnquiry?.module_type === 'PERMISSION' &&
         selectedEnquiry?.requested_permissions?.length > 0 && (
          <>
            <Divider orientation="left">Requested Permissions</Divider>
            <Button
              block
              icon={<SafetyOutlined />}
              type="dashed"
              style={{ marginBottom: 16 }}
              onClick={() => {
                setRespondModal(false);
                openPermissionsForEnquiry(selectedEnquiry);
              }}
            >
              Open Permissions Manager (with pre-highlighted requests)
            </Button>
            <Divider plain>Or write a text response instead</Divider>
          </>
        )}

        <TextArea
          rows={5}
          placeholder="Type your response here (min 5 characters)…"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
        />
      </Modal>

      {/* Full permissions manager — reused from UsersPage, with enquiry highlights */}
      <UserPermissionsModal
        open={!!permUserId}
        onClose={handlePermissionsClose}
        userId={permUserId}
        userName={permUserName}
        highlightedPermissions={selectedEnquiry?.requested_permissions}
      />
    </div>
  );
}

