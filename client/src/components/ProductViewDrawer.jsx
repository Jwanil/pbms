import React from 'react';
import { Tabs, Tag, Table, Divider, Typography, Row, Col, Card } from 'antd';
import './styles/ViewDrawerShared.css';
import {
  InfoCircleOutlined, ShopOutlined, BarcodeOutlined, AppstoreOutlined, FileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useProduct } from '../api/productsApi';
import DocumentsPanel from './DocumentsPanel';
import useAuthStore from '../store/authStore';

const { Text, Title } = Typography;

const SectionTitle = ({ icon, title }) => (
  <div className="drawer-section-heading drawer-section-heading--lg">
    <span className="drawer-section-heading__icon">{icon}</span>
    <Title level={5} className="drawer-section-heading__title">{title}</Title>
  </div>
);

const InfoGrid = ({ items }) => (
  <Row gutter={[24, 24]} className="drawer-fields-row">
    {items.filter(Boolean).map(({ label, value, span = 8 }) => (
      <Col span={span} key={label}>
        <div className="drawer-field drawer-field--lg">
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

const ProductViewDrawer = ({ productId, open, onClose }) => {
  const { data: product, isLoading } = useProduct(productId);
  const currentUser = useAuthStore((state) => state.user);

  if (!product) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Product Details" width={1000} />;

  const mappingColumns = [
    {
      title: 'Company Name',
      dataIndex: ['company', 'company_name'],
      render: (name) => <Text strong className="drawer-field__value">{name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: ['company', 'company_type'],
      render: (type) => <Tag color="blue" className="drawer-tag--sm">{type}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role_type',
      render: (role) => <Tag color="purple" className="drawer-tag--sm">{role}</Tag>,
    },
    {
      title: 'MOQ',
      dataIndex: 'moq',
      render: (val) => val ? <Text strong>{Number(val).toLocaleString()}</Text> : '—',
    },
    {
      title: 'Price Range',
      render: (_, r) => {
        const min = r.price_range_min ? `₹${Number(r.price_range_min).toLocaleString()}` : null;
        const max = r.price_range_max ? `₹${Number(r.price_range_max).toLocaleString()}` : null;
        if (!min && !max) return <Text type="secondary">—</Text>;
        return <Text strong>{min || '?'} – {max || '?'}</Text>;
      },
    },
    {
      title: 'Lead Time',
      dataIndex: 'lead_time_days',
      render: (val) => val ? `${val} days` : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status_flag',
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  const tabs = [
    {
      key: 'details',
      label: (
        <span className="drawer-tab-label"><InfoCircleOutlined className="drawer-tab-icon" />Product Details</span>
      ),
      children: (
        <div className="drawer-section-content">
          <SectionTitle icon={<BarcodeOutlined />} title="Identity & Classification" />
          <InfoGrid items={[
            { label: 'Product Name', value: product.product_name, span: 12 },
            { label: 'SKU', value: product.sku, span: 12 },
            { label: 'Category', value: product.category?.category_name },
            { label: 'Grade', value: product.grade?.grade_name },
            { label: 'Status', value: <StatusBadge status={product.status_flag} /> },
          ]} />

          <SectionTitle icon={<AppstoreOutlined />} title="Technical Specifications" />
          <InfoGrid items={[
            { label: 'CAS Number', value: product.cas_number, span: 12 },
            { label: 'Composition', value: product.composition, span: 12 },
            { label: 'Packaging', value: product.packaging ? `${product.packaging.packaging_name} (${product.packaging.size_value} ${product.packaging.size_unit})` : null, span: 12 },
            { label: 'Unit of Measure', value: product.unit_of_measure, span: 12 },
          ]} />

          <SectionTitle icon={<InfoCircleOutlined />} title="System Information" />
          <InfoGrid items={[
            { label: 'Created By', value: product.creator?.name, span: 12 },
            { label: 'Created At', value: dayjs(product.created_at).format('DD MMM YYYY, HH:mm'), span: 12 },
          ]} />
        </div>
      ),
    },
    {
      key: 'companies',
      label: (
        <span className="drawer-tab-label"><ShopOutlined className="drawer-tab-icon" />Mapped Companies ({(product.mappings || []).length})</span>
      ),
      children: (
        <div className="drawer-section-content">
          <SectionTitle icon={<ShopOutlined />} title="Company Mappings" />
          <Card variant="borderless" styles={{ body: { padding: 0 } }} className="drawer-table-card--shadow">
            <Table
              dataSource={product.mappings || []}
              rowKey="mapping_id"
              pagination={false}
              size="middle"
              locale={{ emptyText: 'No companies mapped to this product' }}
              columns={mappingColumns}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'documents',
      label: (
        <span className="drawer-tab-label"><FileOutlined className="drawer-tab-icon" />Documents</span>
      ),
      children: (
        <div className="drawer-section-content">
          <SectionTitle icon={<FileOutlined />} title="Product Documents" />
          <DocumentsPanel 
            entityType="PRODUCT" 
            entityId={product.product_id} 
            canUpload={product.created_by === currentUser?.user_id || currentUser?.role === 'SUPER_ADMIN'}
          />
        </div>
      )
    }
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Product: ${product.product_name || 'Details'}`} width={1000}>
      <Tabs defaultActiveKey="details" items={tabs} size="large" />
    </ViewDrawer>
  );
};

export default ProductViewDrawer;