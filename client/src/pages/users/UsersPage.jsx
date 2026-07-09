import { useState, useMemo, useCallback } from 'react';
import './UsersPage.css';
import { Button, Form, Input, Select, Space, Tag, Tooltip, Modal } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckOutlined, SafetyOutlined, KeyOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDeactivate from '../../components/ConfirmDeactivate';
import PermissionGuard from '../../components/PermissionGuard';
import UserPermissionsModal from '../../components/UserPermissionsModal';
import {
  useUsers, useUserFormData, useCreateUser,
  useUpdateUser, useDeactivateUser, useReactivateUser, useResetUserPassword
} from '../../api/usersApi';
import useFormErrors from '../../hooks/useFormErrors';
import useAuthStore from '../../store/authStore';
import { message } from 'antd';
import useDebounce  from '../../hooks/useDebounce';

function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); 
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [permUserId, setPermUserId] = useState(null);
  const [permUserName, setPermUserName] = useState('');
  const [resetPwdUserId, setResetPwdUserId] = useState(null);
  const [form] = Form.useForm();
  const [resetPwdForm] = Form.useForm();

  const { user } = useAuthStore();

  const { data, isLoading } = useUsers({ page, limit: 20, search: debouncedSearch, status: statusFilter });
  const { data: formData } = useUserFormData();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deactivateUser, isPending: isDeactivating } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();
  const { mutate: resetPassword, isPending: isResetting } = useResetUserPassword();
  const { applyServerErrors } = useFormErrors(form);

  const openAdd = useCallback(() => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback((record) => {
    setEditingUser(record);
    form.setFieldsValue({
      name: record.name, email: record.email, username: record.username,
      mobile: record.mobile, role_id: record.role.role_id,
      department_id: record.department?.department_id,
    });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback((values) => {
    if (editingUser) {
      updateUser({ id: editingUser.user_id, data: values }, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    } else {
      createUser(values, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    }
  }, [editingUser, updateUser, createUser, applyServerErrors]);

  const handleSearch = useCallback((val) => { setSearch(val); setPage(1); }, []);
  const handlePageChange = useCallback((p) => setPage(p), []);
  const handleStatusFilter = useCallback((val) => { setStatusFilter(val || ''); setPage(1); }, []);

  const handleOpenPermissions = useCallback((record) => {
    setPermUserId(record.user_id);
    setPermUserName(record.name);
  }, []);

  const handleClosePermissions = useCallback(() => setPermUserId(null), []);

  const handleResetPwdClose = useCallback(() => {
    setResetPwdUserId(null);
    resetPwdForm.resetFields();
  }, [resetPwdForm]);

  const handleResetPwdSubmit = useCallback((values) => {
    resetPassword({ userId: resetPwdUserId, newPassword: values.new_password }, {
      onSuccess: () => { setResetPwdUserId(null); resetPwdForm.resetFields(); }
    });
  }, [resetPassword, resetPwdUserId, resetPwdForm]);

  const handleDeactivateConfirm = useCallback(() => {
    deactivateUser(deactivateTarget.user_id, { onSuccess: () => setDeactivateTarget(null) });
  }, [deactivateUser, deactivateTarget]);

  const roleOptions = useMemo(() =>
    (formData?.roles || []).map(r => ({ label: r.role_name, value: r.role_id })),
    [formData?.roles]
  );

  const departmentOptions = useMemo(() =>
    (formData?.departments || []).map(d => ({ label: d.department_name, value: d.department_id })),
    [formData?.departments]
  );

  const columns = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', key: 'role', render: (_, r) => <Tag color="blue">{r.role?.role_name}</Tag> },
    { title: 'Department', key: 'dept', render: (_, r) => r.department?.department_name || '—' },
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
          <PermissionGuard module="users" action="can_edit">
            <Tooltip title="Permissions">
              <Button icon={<SafetyOutlined />} size="small" onClick={() => handleOpenPermissions(record)} />
            </Tooltip>
          </PermissionGuard>
          {user?.role === 'SUPER_ADMIN' && (
            <Tooltip title="Reset Password">
              <Button icon={<KeyOutlined />} size="small" onClick={() => setResetPwdUserId(record.user_id)} />
            </Tooltip>
          )}
        </Space>
      )
    }
  ], [openEdit, reactivateUser, handleOpenPermissions, user?.role]);

  const statusFilterElement = useMemo(() => (
    <Select
      placeholder="Filter by status"
      allowClear
      className="users-filter-status"
      onChange={handleStatusFilter}
      options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]}
    />
  ), [handleStatusFilter]);

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users - Super Admin only"
        breadcrumbs={['Admin', 'Users']}
        extra={
          <PermissionGuard module="users" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="btn-primary-dark">
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
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        extraFilters={statusFilterElement}
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
        <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email', message: 'Invalid email format' }]}>
          <Input placeholder="Enter email address" autoComplete="off" />
        </Form.Item>
        <Form.Item name="username" label="Username" rules={[
          { required: true },
          { min: 3, message: 'At least 3 characters' },
          { max: 50, message: 'Cannot exceed 50 characters' },
          { pattern: /^[a-zA-Z0-9_\.]+$/, message: 'Only letters, numbers, _ and . allowed' }
        ]}>
          <Input placeholder="Enter username" autoComplete="off" />
        </Form.Item>
        {!editingUser && (
          <Form.Item name="password" label="Password" rules={[
            { required: true, message: 'Password is required' },
            { min: 8, message: 'At least 8 characters' },
            { pattern: /[A-Z]/, message: 'Must contain an uppercase letter' },
            { pattern: /[a-z]/, message: 'Must contain a lowercase letter' },
            { pattern: /[0-9]/, message: 'Must contain a number' },
            { pattern: /[^A-Za-z0-9]/, message: 'Must contain a special character' },
          ]}>
            <Input.Password placeholder="Minimum 8 characters" autoComplete="new-password" />
          </Form.Item>
        )}
        <Form.Item name="mobile" label="Mobile" rules={[{ pattern: /^[0-9]{10,15}$/, message: 'Must be 10-15 digits' }]}>
          <Input placeholder="Enter mobile number" />
        </Form.Item>
        <Form.Item name="role_id" label="Role" rules={[{ required: true }]}>
          <Select placeholder="Select role" options={roleOptions} />
        </Form.Item>
        <Form.Item name="department_id" label="Department">
          <Select placeholder="Select department (optional)" allowClear options={departmentOptions} />
        </Form.Item>
      </FormModal>

      <ConfirmDeactivate
        open={!!deactivateTarget}
        recordName={deactivateTarget?.name}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
        loading={isDeactivating}
      />

      <UserPermissionsModal
        open={!!permUserId}
        onClose={handleClosePermissions}
        userId={permUserId}
        userName={permUserName}
      />

      <Modal
        title="Reset User Password"
        open={!!resetPwdUserId}
        onCancel={handleResetPwdClose}
        onOk={() => resetPwdForm.submit()}
        okText="Reset Password"
        confirmLoading={isResetting}
      >
        <Form form={resetPwdForm} layout="vertical" onFinish={handleResetPwdSubmit}>
          <Form.Item name="new_password" label="New Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password placeholder="Min 8 chars, upper, lower, number, special" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UsersPage;
