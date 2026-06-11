import React from 'react';
import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useMapping } from '../api/mappingsApi';

const MappingViewDrawer = ({ mappingId, open, onClose }) => {
  const { data: mapping, isLoading } = useMapping(mappingId);

  if (!mapping) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Mapping Details" />;

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Mapping Details">
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Company Name" span={2}>{mapping.company?.company_name}</Descriptions.Item>
        <Descriptions.Item label="Company Type"><Tag>{mapping.company?.company_type}</Tag></Descriptions.Item>
        <Descriptions.Item label="Company Email">{mapping.company?.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="Company Phone">{mapping.company?.phone || '-'}</Descriptions.Item>
        
        <Descriptions.Item label="Product Name" span={2}>{mapping.product?.product_name}</Descriptions.Item>
        <Descriptions.Item label="Product SKU">{mapping.product?.sku}</Descriptions.Item>
        <Descriptions.Item label="Composition">{mapping.product?.composition || '-'}</Descriptions.Item>
        
        <Descriptions.Item label="Role Type">{mapping.role_type}</Descriptions.Item>
        <Descriptions.Item label="MOQ">{mapping.moq || '-'}</Descriptions.Item>
        <Descriptions.Item label="Price Range Min">{mapping.price_range_min || '-'}</Descriptions.Item>
        <Descriptions.Item label="Price Range Max">{mapping.price_range_max || '-'}</Descriptions.Item>
        <Descriptions.Item label="Lead Time (days)">{mapping.lead_time_days || '-'}</Descriptions.Item>
        
        <Descriptions.Item label="Active Status"><StatusBadge status={mapping.is_active ? 'ACTIVE' : 'INACTIVE'} /></Descriptions.Item>
        <Descriptions.Item label="Created At">{dayjs(mapping.created_at).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
      </Descriptions>
    </ViewDrawer>
  );
};

export default MappingViewDrawer;