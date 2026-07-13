import { useState, useEffect } from 'react';
import './styles/UserPermissionsModal.css';
import { Modal, Table, Switch, Button, Spin, Alert, Badge, Tooltip } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useUserPermissions, useUpdateUserPermissions } from '../api/userPermissionsApi';

import { MODULE_LABELS } from '../utils/constants';

/**
 * UserPermissionsModal
 *
 * Props:
 *   open                   — boolean
 *   onClose                — () => void
 *   userId                 — number
 *   userName               — string
 *   highlightedPermissions — optional array from a PERMISSION enquiry:
 *                            [{ module, can_view, can_create, can_edit, can_delete }, ...]
 *                            Requested switches are pre-enabled and highlighted in amber.
 */
function UserPermissionsModal({ open, onClose, userId, userName, highlightedPermissions }) {
  const { data: permissionsData, isLoading, isError } = useUserPermissions(userId);
  const { mutate: updatePermissions, isPending: isSaving } = useUpdateUserPermissions();

  const [localPermissions, setLocalPermissions] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Build lookup: { module_name: { can_view, can_create, ... } }
  const requestedMap = {};
  (highlightedPermissions || []).forEach(({ module, ...actions }) => {
    requestedMap[module] = actions;
  });

  useEffect(() => {
    if (permissionsData) {
      let merged = permissionsData.map(p => ({ ...p }));

      // Pre-apply requested permissions on top of current state
      if (highlightedPermissions?.length) {
        merged = merged.map(p => {
          const req = requestedMap[p.module_name];
          if (!req) return p;
          return {
            ...p,
            can_view:   p.can_view   || !!req.can_view,
            can_create: p.can_create || !!req.can_create,
            can_edit:   p.can_edit   || !!req.can_edit,
            can_delete: p.can_delete || !!req.can_delete,
          };
        });
      }

      setLocalPermissions(merged);
      // Pre-mark dirty so Save is enabled when opened from an enquiry
      setIsDirty(!!highlightedPermissions?.length);
    }
  }, [permissionsData, open]);

  const handleToggle = (moduleIndex, field, value) => {
    setLocalPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = { ...updated[moduleIndex], [field]: value };

      // Turning off view → clear all
      if (field === 'can_view' && !value) {
        updated[moduleIndex].can_create = false;
        updated[moduleIndex].can_edit   = false;
        updated[moduleIndex].can_delete = false;
      }

      // Turning on create/edit/delete → auto-enable view
      if (['can_create', 'can_edit', 'can_delete'].includes(field) && value) {
        updated[moduleIndex].can_view = true;
      }

      return updated;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    updatePermissions(
      {
        userId,
        permissions: localPermissions.map(p => ({
          module_name: p.module_name,
          can_view:    p.can_view,
          can_create:  p.can_create,
          can_edit:    p.can_edit,
          can_delete:  p.can_delete,
        })),
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          onClose();
        },
      }
    );
  };

  // Was this module+action specifically requested in the enquiry?
  const isRequested = (moduleName, action) =>
    !!requestedMap[moduleName]?.[action];

  const renderSwitch = (record, index, field, disabled) => {
    const requested = isRequested(record.module_name, field);
    const sw = (
      <Switch
        checked={record[field]}
        onChange={(val) => handleToggle(index, field, val)}
        size="small"
        disabled={disabled}
        // Light blue tint when the switch was part of the request
        style={requested && record[field] ? { backgroundColor: '#1677ff' } : undefined}
      />
    );

    return requested ? (
      <Tooltip title="Requested by user">
        <span className="perm-request-highlight">
          {sw}
        </span>
      </Tooltip>
    ) : sw;
  };

  const columns = [
    {
      title:     'Module',
      dataIndex: 'module_name',
      key:       'module_name',
      width:     200,
      render: (val, record) => {
        const hasRequest = !!requestedMap[record.module_name];
        return (
          <span className={hasRequest ? 'perm-module-name perm-module-name--requested' : 'perm-module-name'}>
            {hasRequest && <Badge status="processing" className="perm-request-badge" />}
            {MODULE_LABELS[val] || val}
          </span>
        );
      },
    },
    {
      title: 'View',   key: 'can_view',   width: 80, align: 'center',
      render: (_, r, i) => renderSwitch(r, i, 'can_view', false),
    },
    {
      title: 'Create', key: 'can_create', width: 80, align: 'center',
      render: (_, r, i) => renderSwitch(r, i, 'can_create', !r.can_view),
    },
    {
      title: 'Edit',   key: 'can_edit',   width: 80, align: 'center',
      render: (_, r, i) => renderSwitch(r, i, 'can_edit', !r.can_view),
    },
    {
      title: 'Delete', key: 'can_delete', width: 80, align: 'center',
      render: (_, r, i) => renderSwitch(r, i, 'can_delete', !r.can_view),
    },
  ];

  return (
    <Modal
      title={
        highlightedPermissions?.length
          ? `Grant Permissions — ${userName}  (🔵 = requested)`
          : `Permissions — ${userName}`
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={isSaving}
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save Permissions
        </Button>,
      ]}
    >
      {highlightedPermissions?.length > 0 && (
        <Alert
          type="info"
          showIcon
          className="perm-save-btn"
          message="🔵 Highlighted areas show what the user requested. Review, adjust if needed, then Save."
        />
      )}

      {isLoading ? (
        <Spin className="perm-loading" />
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
