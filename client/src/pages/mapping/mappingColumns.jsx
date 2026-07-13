import { Button, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';

import { ROLE_TYPES } from '../../utils/constants';

export function buildMappingColumns({ onView, onEdit, onDelete, onDeactivate, onReactivate, queryClient }) {
  return [
    { title: 'Company', key: 'company', width: 200, render: (_, r) => r.company?.company_name || '—' },
    { title: 'Product', key: 'product', width: 200, render: (_, r) => `${r.product?.product_name || '—'} (${r.product?.sku || ''})` },
    {
      title: 'Role', key: 'role_type', width: 130,
      render: (_, r) => {
        const t = ROLE_TYPES.find(rt => rt.value === r.role_type);
        return <Tag color={t?.color}>{t?.label || r.role_type}</Tag>;
      },
    },
    { title: 'MOQ', key: 'moq', width: 100, render: (_, r) => r.moq ? Number(r.moq).toLocaleString() : '—' },
    {
      title: 'Price Range', key: 'price', width: 150,
      render: (_, r) => {
        if (!r.price_range_min && !r.price_range_max) return '—';
        const min = r.price_range_min ? `₹${Number(r.price_range_min).toLocaleString()}` : '';
        const max = r.price_range_max ? `₹${Number(r.price_range_max).toLocaleString()}` : '';
        return `${min} – ${max}`;
      },
    },
    { title: 'Lead Time', key: 'lead_time_days', width: 100, render: (_, r) => r.lead_time_days ? `${r.lead_time_days} days` : '—' },
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive   = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        if (!isActive && !isInactive) return <StatusBadge status={record.status_flag} />;
        const actionLabel = isActive ? 'Deactivate' : 'Reactivate';
        return (
          <PermissionGuard module="mappings" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this mapping?`}
              description={`Mapping will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`}
              onConfirm={() =>
                isActive
                  ? onDeactivate(record.mapping_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }) })
                  : onReactivate(record.mapping_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mappings'] }) })
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
          <PermissionGuard module="mappings" action="can_view">
            <Tooltip title="View" mouseEnterDelay={3}>
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.mapping_id)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="mappings" action="can_edit">
            <Tooltip title="Edit" mouseEnterDelay={3}>
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="mappings" action="can_delete">
            <Tooltip title="Delete" mouseEnterDelay={3}>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];
}
