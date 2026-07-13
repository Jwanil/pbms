import { Button, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';

import { CONTACT_TYPES, LANGUAGES } from '../../utils/constants';

export function buildContactColumns({ onView, onEdit, onDelete, onDeactivate, onReactivate, queryClient }) {
  return [
    { title: 'Name',    key: 'name',    width: 180, render: (_, r) => `${r.first_name} ${r.last_name || ''}`.trim() },
    { title: 'Mobile',  dataIndex: 'mobile', key: 'mobile', width: 130 },
    { title: 'Email',   dataIndex: 'email',  key: 'email',  width: 180 },
    { title: 'Company', key: 'company', width: 160, render: (_, r) => r.company?.company_name || '—' },
    {
      title: 'Type', key: 'contact_type', width: 140,
      render: (_, r) => {
        const t = CONTACT_TYPES.find(ct => ct.value === r.contact_type);
        return r.contact_type ? <Tag color={t?.color}>{t?.label || r.contact_type}</Tag> : '—';
      },
    },
    {
      title: 'Tags', key: 'tags', width: 160,
      render: (_, r) => {
        if (!r.tags) return '—';
        try { return JSON.parse(r.tags).map(tag => <Tag key={tag}>{tag}</Tag>); }
        catch { return '—'; }
      },
    },
    { title: 'Interests', key: 'interests', width: 80, align: 'center', render: (_, r) => r._count?.interests || 0 },
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive   = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        if (!isActive && !isInactive) return <StatusBadge status={record.status_flag} />;
        const actionLabel = isActive ? 'Deactivate' : 'Reactivate';
        return (
          <PermissionGuard module="contacts" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this contact?`}
              description={`Contact will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`}
              onConfirm={() =>
                isActive
                  ? onDeactivate(record.contact_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }) })
                  : onReactivate(record.contact_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }) })
              }
              okText={actionLabel} okType={isActive ? 'danger' : 'primary'} cancelText="Cancel"
            >
              <span style={{ cursor: 'pointer' }}><StatusBadge status={record.status_flag} /></span>
            </Popconfirm>
          </PermissionGuard>
        );
      },
    },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_, record) => (
        <Space>
          <PermissionGuard module="contacts" action="can_view">
            <Tooltip title="View" mouseEnterDelay={3}>
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.contact_id)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="contacts" action="can_edit">
            <Tooltip title="Edit" mouseEnterDelay={3}>
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="contacts" action="can_delete">
            <Tooltip title="Delete" mouseEnterDelay={3}>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];
}
