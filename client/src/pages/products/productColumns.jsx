import { Button, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';

import { PRODUCT_STATUS_OPTIONS } from '../../utils/constants';

export function buildProductColumns({ onView, onEdit, onDelete, onDeactivate, onReactivate, queryClient }) {
  return [
    { title: 'Product Name', dataIndex: 'product_name', key: 'product_name', width: 200 },
    { title: 'SKU',          dataIndex: 'sku',          key: 'sku',          width: 120 },
    { title: 'CAS Number',   dataIndex: 'cas_number',   key: 'cas_number',   width: 130 },
    { title: 'Category', key: 'category', width: 130, render: (_, r) => r.category?.category_name || '—' },
    { title: 'Grade',    key: 'grade',    width: 100, render: (_, r) => r.grade?.grade_name || '—' },
    { title: 'UOM', dataIndex: 'unit_of_measure', key: 'uom', width: 70 },
    {
      title: 'Status', key: 'status', width: 130,
      render: (_, record) => {
        const isActive   = record.status_flag === 0;
        const isInactive = record.status_flag === 2;
        if (!isActive && !isInactive) return <StatusBadge status={record.status_flag} />;
        const actionLabel = isActive ? 'Deactivate' : 'Reactivate';
        return (
          <PermissionGuard module="products" action="can_edit">
            <Popconfirm
              title={`${actionLabel} this product?`}
              description={
                isActive && record._count?.mappings > 0
                  ? `⚠️ This product has ${record._count.mappings} active mapping(s).`
                  : `Product will be set to ${isActive ? 'INACTIVE' : 'ACTIVE'}.`
              }
              onConfirm={() =>
                isActive
                  ? onDeactivate(record.product_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) })
                  : onReactivate(record.product_id, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) })
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
          <PermissionGuard module="products" action="can_view">
            <Tooltip title="View" mouseEnterDelay={3}>
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.product_id)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_edit">
            <Tooltip title="Edit" mouseEnterDelay={3}>
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module="products" action="can_delete">
            <Tooltip title="Delete" mouseEnterDelay={3}>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];
}
