import { useState, useEffect } from 'react';
import { Modal, Table, Switch, Button, Spin, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useUserPermissions, useUpdateUserPermissions } from '../api/userPermissionsApi';

const MODULE_LABELS = {
  products: 'Products',
  companies: 'Companies',
  mappings: 'Product Mapping',
  contacts: 'Contacts',
  packaging: 'Packaging',
  categories: 'Categories',
  departments: 'Departments',
  grades: 'Grades',
  users: 'User Management',
  roles: 'Roles & Rights',
  dashboard: 'Dashboard',
};

function UserPermissionsModal({ open, onClose, userId, userName }) {
  const { data: permissionsData, isLoading, isError } = useUserPermissions(userId);
  const { mutate: updatePermissions, isPending: isSaving } = useUpdateUserPermissions();

  const [localPermissions, setLocalPermissions] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (permissionsData) {
      setLocalPermissions(permissionsData.map(p => ({ ...p })));
      setIsDirty(false);
    }
  }, [permissionsData, open]);

  const handleToggle = (moduleIndex, field, value) => {
    setLocalPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = { ...updated[moduleIndex], [field]: value };

      if (field === 'can_view' && !value) {
        updated[moduleIndex].can_create = false;
        updated[moduleIndex].can_edit = false;
        updated[moduleIndex].can_delete = false;
      }

      if (['can_create', 'can_edit', 'can_delete'].includes(field) && value) {
        updated[moduleIndex].can_view = true;
      }

      return updated;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    updatePermissions(
      { userId, permissions: localPermissions.map(p => ({
        module_name: p.module_name,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }))},
      { onSuccess: () => {
          setIsDirty(false);
          onClose();
        } 
      }
    );
  };

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
    <Modal
      title={`Permissions for ${userName}`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={isSaving}
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save Permissions
        </Button>
      ]}
    >
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : isError ? (
        <Alert type="error" message="Failed to load permissions" />
      ) : (
        <Table
          columns={columns}
          dataSource={localPermissions}
          rowKey="module_name"
          pagination={false}
          size="small"
          bordered
        />
      )}
    </Modal>
  );
}

export default UserPermissionsModal;
