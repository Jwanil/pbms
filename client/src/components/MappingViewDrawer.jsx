import React from 'react';
import { Tag, Divider, Typography, Row, Col } from 'antd';
import { LinkOutlined, ShopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useMapping } from '../api/mappingsApi';

const { Text, Title } = Typography;

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
    <span style={{ color: '#1F3A6E', fontSize: 15 }}>{icon}</span>
    <Title level={5} style={{ margin: 0, color: '#1F3A6E', fontWeight: 600 }}>{title}</Title>
  </div>
);

const InfoGrid = ({ items }) => (
  <Row gutter={[16, 8]} style={{ marginBottom: 4 }}>
    {items.map(({ label, value, span = 12 }) => (
      <Col span={span} key={label}>
        <div style={{
          background: '#fff',
          border: '1px solid #e8edf5',
          borderRadius: 8,
          padding: '10px 14px',
          height: '100%',
        }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {label}
          </Text>
          <Text strong style={{ fontSize: 13, color: '#1a1a2e', wordBreak: 'break-word' }}>
            {value || <Text type="secondary">—</Text>}
          </Text>
        </div>
      </Col>
    ))}
  </Row>
);

const ROLE_COLORS = { MANUFACTURER: 'blue', SUPPLIER: 'green', DISTRIBUTOR: 'purple' };
const COMPANY_TYPE_COLORS = { MANUFACTURER: 'blue', SUPPLIER: 'green', BUYER: 'orange', DISTRIBUTOR: 'purple' };

const MappingViewDrawer = ({ mappingId, open, onClose }) => {
  const { data: mapping, isLoading } = useMapping(mappingId);

  if (!mapping) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Mapping Details" />;

  const priceRange = (() => {
    const min = mapping.price_range_min ? `₹${Number(mapping.price_range_min).toLocaleString()}` : null;
    const max = mapping.price_range_max ? `₹${Number(mapping.price_range_max).toLocaleString()}` : null;
    if (!min && !max) return null;
    return `${min || '?'} – ${max || '?'}`;
  })();

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Mapping Details">
      <SectionTitle icon={<ShopOutlined />} title="Company" />
      <InfoGrid items={[
        { label: 'Company Name', value: mapping.company?.company_name, span: 24 },
        {
          label: 'Company Type',
          value: <Tag color={COMPANY_TYPE_COLORS[mapping.company?.company_type] || 'default'} style={{ borderRadius: 4 }}>
            {mapping.company?.company_type}
          </Tag>,
        },
        { label: 'Company Email', value: mapping.company?.email },
        { label: 'Company Phone', value: mapping.company?.phone },
        { label: 'Company Status', value: <StatusBadge status={mapping.company?.status} /> },
      ]} />

      <Divider style={{ margin: '16px 0' }} />
      <SectionTitle icon={<InfoCircleOutlined />} title="Product" />
      <InfoGrid items={[
        { label: 'Product Name', value: mapping.product?.product_name, span: 24 },
        { label: 'SKU', value: mapping.product?.sku },
        { label: 'Product Status', value: <StatusBadge status={mapping.product?.status} /> },
      ]} />

      <Divider style={{ margin: '16px 0' }} />
      <SectionTitle icon={<LinkOutlined />} title="Mapping Terms" />
      <InfoGrid items={[
        {
          label: 'Role Type',
          value: <Tag color={ROLE_COLORS[mapping.role_type] || 'default'} style={{ borderRadius: 4 }}>
            {mapping.role_type}
          </Tag>,
        },
        {
          label: 'Active Status',
          value: <StatusBadge status={mapping.is_active ? 'ACTIVE' : 'INACTIVE'} />,
        },
        {
          label: 'MOQ',
          value: mapping.moq ? Number(mapping.moq).toLocaleString() : null,
        },
        {
          label: 'Lead Time',
          value: mapping.lead_time_days ? `${mapping.lead_time_days} days` : null,
        },
        {
          label: 'Price Range',
          value: priceRange,
          span: 24,
        },
        {
          label: 'Created At',
          value: dayjs(mapping.created_at).format('DD MMM YYYY, HH:mm'),
          span: 12,
        },
      ]} />
    </ViewDrawer>
  );
};

export default MappingViewDrawer;
