import React from 'react';
import { Tag, Divider, Typography, Row, Col } from 'antd';
import './styles/ViewDrawerShared.css';
import { LinkOutlined, ShopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useMapping } from '../api/mappingsApi';

const { Text, Title } = Typography;

const SectionTitle = ({ icon, title }) => (
  <div className="drawer-section-heading">
    <span className="drawer-section-heading__icon">{icon}</span>
    <Title level={5} className="drawer-section-heading__title">{title}</Title>
  </div>
);

const InfoGrid = ({ items }) => (
  <Row gutter={[16, 8]} className="drawer-fields-row">
    {items.map(({ label, value, span = 12 }) => (
      <Col span={span} key={label}>
        <div className="drawer-field">
          <Text type="secondary" className="drawer-field__label">
            {label}
          </Text>
          <Text strong className="drawer-field__value">
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
          value: <Tag color={COMPANY_TYPE_COLORS[mapping.company?.company_type] || 'default'} className="drawer-tag">
            {mapping.company?.company_type}
          </Tag>,
        },
        { label: 'Company Email', value: mapping.company?.email },
        { label: 'Company Phone', value: mapping.company?.phone },
        { label: 'Company Status', value: <StatusBadge status={mapping.company?.status_flag} /> },
      ]} />

      <Divider className="drawer-divider" />
      <SectionTitle icon={<InfoCircleOutlined />} title="Product" />
      <InfoGrid items={[
        { label: 'Product Name', value: mapping.product?.product_name, span: 24 },
        { label: 'SKU', value: mapping.product?.sku },
        { label: 'Product Status', value: <StatusBadge status={mapping.product?.status_flag} /> },
      ]} />

      <Divider className="drawer-divider" />
      <SectionTitle icon={<LinkOutlined />} title="Mapping Terms" />
      <InfoGrid items={[
        {
          label: 'Role Type',
          value: <Tag color={ROLE_COLORS[mapping.role_type] || 'default'} className="drawer-tag">
            {mapping.role_type}
          </Tag>,
        },
        {
          label: 'Active Status',
          value: <StatusBadge status={mapping.status_flag} />,
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
