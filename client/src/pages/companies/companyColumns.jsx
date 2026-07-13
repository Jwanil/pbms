import { Button, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';

import { COMPANY_TYPES } from '../../utils/constants';

export function buildCompanyColumns({ onView, onEdit, onDelete, onDeactivate, onReactivate, queryClient }) {
  return [
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name', width: 200 },
    {
      title: 'Type', key: 'company_type', width: 130,
      render: (_, r) => {
        const t = COMPANY_TYPES.find(ct => ct.value === r.company_type);
        return <Tag color={t?.color}>{t?.label || r.company_type}</Tag>;
      },
    },
    { title: 'Email',    dataIndex: 'email',      key: 'email',    width: 180 },
    { title: 'Phone',    dataIndex: 'phone',      key: 'phone',    width: 130 },
    { title: 'GST',      dataIndex: 'gst_number', key: 'gst',      width: 160 },
    { title: 'Branches', key: 'branches',         width: 80, align: 'center', render: (_, r) => r._count?.branches || 0 },
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive   = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        if (!isActive && !isInactive) return <StatusBadge status={record.status_flag} />;
        const actionLabel = isActive ? 'Deactivate' : 'Reactivate';
        return (
          <PermissionGuard module="companies" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this company?`}
              description={
                isActive && record._count?.mappings > 0
                  ? `⚠️ This company has ${record._count.mappings} active mapping(s).`
                  : `Company will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`
              }
              onConfirm={() =>
                isActive
                  ? onDeactivate(record.company_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }) })
                  : onReactivate(record.company_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }) })
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
          <PermissionGuard module="companies" action="can_view">
            <Tooltip title="View" mouseEnterDelay={3}>
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.company_id)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="companies" action="can_edit">
            <Tooltip title="Edit" mouseEnterDelay={3}>
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="companies" action="can_delete">
            <Tooltip title="Delete" mouseEnterDelay={3}>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];
}
