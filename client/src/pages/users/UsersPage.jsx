import { useState } from 'react';
import { Button, Form, Input, Select, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeactivate from '../../components/ConfirmDeactivate';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useUsers, useUserFormData, useCreateUser,
  useUpdateUser, useDeactivateUser, useReactivateUser
} from '../../api/usersApi';

function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useUsers({ page, limit: 20, search, status: statusFilter });
  const { data: formData } = useUserFormData();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deactivateUser, isPending: isDeactivating } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();

  const openAdd = () => { setEditingUser(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name, email: user.email, username: user.username,
      mobile: user.mobile, role_id: user.role.role_id,
      department_id: user.department?.department_id,
    });
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingUser) {
      updateUser({ id: editingUser.user_id, data: values }, { onSuccess: () => setModalOpen(false) });
    } else {
      createUser(values, { onSuccess: () => setModalOpen(false) });
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', key: 'role', render: (_, r) => <Tag color="blue">{r.role?.role_name}</Tag> },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '\u2014' },
    { title: 'Status', key: 'status', render: (_, r) => <StatusBadge status={r.status} /> },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <PermissionGuard module="users" action="can_edit">
            <Tooltip title="Edit">
              <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="users" action="can_delete">
            {record.status === 'ACTIVE' ? (
              <Tooltip title="Deactivate">
                <Button icon={<StopOutlined />} size="small" danger onClick={() => setDeactivateTarget(record)} />
              </Tooltip>
            ) : (
              <Tooltip title="Reactivate">
                <Button icon={<CheckOutlined />} size="small" onClick={() => reactivateUser(record.user_id)} />
              </Tooltip>
            )}
          </PermissionGuard>
        </Space>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users - Super Admin only"
        breadcrumbs={['Admin', 'Users']}
        extra={
          <PermissionGuard module="users" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ background: '#1F3A6E' }}>
              Add User
            </Button>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        total={data?.pagination?.total || 0}
        rowKey="user_id"
        searchPlaceholder="Search by name, email, or username..."
        onSearch={(val) => { setSearch(val); setPage(1); }}
        onPageChange={(p) => setPage(p)}
        extraFilters={
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 160 }}
            onChange={(val) => { setStatusFilter(val || ''); setPage(1); }}
            options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]}
          />
        }
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingUser ? 'Edit User' : 'Add User'}
        form={form}
        loading={isCreating || isUpdating}
      >
        <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
          <Input placeholder="Enter full name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
          <Input placeholder="Enter email address" />
        </Form.Item>
        <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
          <Input placeholder="Enter username (no spaces)" />
        </Form.Item>
        {!editingUser && (
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password placeholder="Minimum 8 characters" />
          </Form.Item>
        )}
        <Form.Item name="mobile" label="Mobile">
          <Input placeholder="Enter mobile number" />
        </Form.Item>
        <Form.Item name="role_id" label="Role" rules={[{ required: true }]}>
          <Select
            placeholder="Select role"
            options={(formData?.roles || []).map(r => ({ label: r.role_name, value: r.role_id }))}
          />
        </Form.Item>
        <Form.Item name="department_id" label="Department">
          <Select
            placeholder="Select department (optional)"
            allowClear
            options={(formData?.departments || []).map(d => ({ label: d.department_name, value: d.department_id }))}
          />
        </Form.Item>
      </FormModal>

      <ConfirmDeactivate
        open={!!deactivateTarget}
        recordName={deactivateTarget?.name}
        onConfirm={() => deactivateUser(deactivateTarget.user_id, { onSuccess: () => setDeactivateTarget(null) })}
        onCancel={() => setDeactivateTarget(null)}
        loading={isDeactivating}
      />
    </div>
  );
}

export default UsersPage;
