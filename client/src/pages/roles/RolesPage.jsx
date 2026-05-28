import { useState, useEffect } from 'react';
import { Tabs, Table, Switch, Button, Space, Tag, Spin, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import PermissionGuard from '../../components/PermissionGuard';
import { useRoles, useRolePermissions, useUpdateRolePermissions } from '../../api/rolesApi';

// Human-readable module labels
const MODULE_LABELS = {
  products: 'Products',
  companies: 'Companies',
  company_product_mapping: 'Product Mapping',
  contacts: 'Contacts',
  packaging: 'Packaging',
  categories: 'Categories',
  departments: 'Departments',
  grades: 'Grades',
  users: 'User Management',
  roles: 'Roles & Rights',
  dashboard: 'Dashboard',
};

// Permissions tab for a single role
function RolePermissionsTab({ roleId, roleName }) {
  const { data: roleData, isLoading, isError } = useRolePermissions(roleId);
  const { mutate: updatePermissions, isPending: isSaving } = useUpdateRolePermissions();

  // Local state — copy of permissions the user can edit before saving
  const [localPermissions, setLocalPermissions] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (roleData?.permissions) {
      setLocalPermissions(roleData.permissions.map(p => ({ ...p })));
      setIsDirty(false);
    }
  }, [roleData]);

  const handleToggle = (moduleIndex, field, value) => {
    setLocalPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = { ...updated[moduleIndex], [field]: value };

      // Business rule: if can_view is turned off, turn off all other permissions too
      if (field === 'can_view' && !value) {
        updated[moduleIndex].can_create = false;
        updated[moduleIndex].can_edit = false;
        updated[moduleIndex].can_delete = false;
      }

      // Business rule: if any action is turned on, can_view must also be on
      if (['can_create', 'can_edit', 'can_delete'].includes(field) && value) {
        updated[moduleIndex].can_view = true;
      }

      return updated;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    updatePermissions(
      { roleId, permissions: localPermissions.map(p => ({
        module_name: p.module_name,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }))},
      { onSuccess: () => setIsDirty(false) }
    );
  };

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (isError) return <Alert type="error" message="Failed to load permissions" />;

  const columns = [
    {
      title: 'Module',
      dataIndex: 'module_name',
      key: 'module_name',
      width: 220,
      render: (val) => MODULE_LABELS[val] || val,
    },
    {
      title: 'View',
      key: 'can_view',
      width: 80,
      align: 'center',
      render: (_, record, index) => (
        <Switch
          checked={record.can_view}
          onChange={(val) => handleToggle(index, 'can_view', val)}
          size="small"
        />
      ),
    },
    {
      title: 'Create',
      key: 'can_create',
      width: 80,
      align: 'center',
      render: (_, record, index) => (
        <Switch
          checked={record.can_create}
          onChange={(val) => handleToggle(index, 'can_create', val)}
          size="small"
          disabled={!record.can_view}
        />
      ),
    },
    {
      title: 'Edit',
      key: 'can_edit',
      width: 80,
      align: 'center',
      render: (_, record, index) => (
        <Switch
          checked={record.can_edit}
          onChange={(val) => handleToggle(index, 'can_edit', val)}
          size="small"
          disabled={!record.can_view}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'can_delete',
      width: 80,
      align: 'center',
      render: (_, record, index) => (
        <Switch
          checked={record.can_delete}
          onChange={(val) => handleToggle(index, 'can_delete', val)}
          size="small"
          disabled={!record.can_view}
        />
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={localPermissions}
        rowKey="module_name"
        pagination={false}
        size="middle"
        style={{ marginBottom: 24 }}
      />
      <PermissionGuard module="roles" action="can_edit">
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isSaving}
            disabled={!isDirty}
            style={{ background: isDirty ? '#1F3A6E' : undefined }}
          >
            {isDirty ? 'Save Changes' : 'No Changes'}
          </Button>
          {isDirty && (
            <Tag color="orange">Unsaved changes</Tag>
          )}
        </Space>
      </PermissionGuard>
    </div>
  );
}

// Main page
function RolesPage() {
  const { data: roles, isLoading } = useRoles();

  const ROLE_COLORS = {
    SUPER_ADMIN: 'red',
    ADMIN: 'blue',
    STAFF: 'green',
  };

  const tabItems = (roles || []).map((role) => ({
    key: String(role.role_id),
    label: (
      <Space>
        <Tag color={ROLE_COLORS[role.role_name] || 'default'}>{role.role_name}</Tag>
      </Space>
    ),
    children: <RolePermissionsTab roleId={role.role_id} roleName={role.role_name} />,
  }));

  return (
    <div>
      <PageHeader
        title="Roles & Rights"
        subtitle="Manage module-level permissions per role — Super Admin only"
        breadcrumbs={['Admin', 'Roles & Rights']}
      />
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Tabs
          items={tabItems}
          type="card"
          style={{ background: '#fff' }}
        />
      )}
    </div>
  );
}

export default RolesPage;
