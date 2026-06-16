import React from 'react';
import { Tabs, Tag, Table, Divider, Typography, Row, Col, Card } from 'antd';
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
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
    <span style={{ color: '#1F3A6E', fontSize: 18 }}>{icon}</span>
    <Title level={5} style={{ margin: 0, color: '#1F3A6E', fontWeight: 600 }}>{title}</Title>
  </div>
);

const InfoGrid = ({ items }) => (
  <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
    {items.filter(Boolean).map(({ label, value, span = 8 }) => (
      <Col span={span} key={label}>
        <div style={{
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: '16px',
          height: '100%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
            {label}
          </Text>
          <Text strong style={{ fontSize: 15, color: '#1a1a2e', wordBreak: 'break-word', display: 'block' }}>
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
      render: (name) => <Text strong style={{ fontSize: 14 }}>{name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: ['company', 'company_type'],
      render: (type) => <Tag color="blue" style={{ borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>{type}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role_type',
      render: (role) => <Tag color="purple" style={{ borderRadius: 4, padding: '2px 8px', fontSize: 13 }}>{role}</Tag>,
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
      dataIndex: 'is_active',
      render: (active) => <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  const tabs = [
    {
      key: 'details',
      label: (
        <span style={{ fontSize: 15, padding: '0 8px' }}><InfoCircleOutlined style={{ marginRight: 8 }} />Product Details</span>
      ),
      children: (
        <div style={{ padding: '8px 0' }}>
          <SectionTitle icon={<BarcodeOutlined />} title="Identity & Classification" />
          <InfoGrid items={[
            { label: 'Product Name', value: product.product_name, span: 12 },
            { label: 'SKU', value: product.sku, span: 12 },
            { label: 'Category', value: product.category?.category_name },
            { label: 'Grade', value: product.grade?.grade_name },
            { label: 'Status', value: <StatusBadge status={product.status} /> },
          ]} />

          <SectionTitle icon={<AppstoreOutlined />} title="Technical Specifications" />
          <InfoGrid items={[
            { label: 'CAS Number', value: product.cas_number },
            { label: 'Composition', value: product.composition, span: 16 },
            { label: 'Molecular Formula', value: product.molecular_formula },
            { label: 'Molecular Weight', value: product.molecular_weight },
            { label: 'Purity', value: product.purity ? `${product.purity}%` : null },
            { label: 'Process Type', value: product.process_type },
            { label: 'Packaging', value: product.packaging ? `${product.packaging.packaging_name} (${product.packaging.size_value} ${product.packaging.size_unit})` : null },
            { label: 'Unit of Measure', value: product.unit_of_measure },
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
        <span style={{ fontSize: 15, padding: '0 8px' }}><ShopOutlined style={{ marginRight: 8 }} />Mapped Companies ({(product.mappings || []).length})</span>
      ),
      children: (
        <div style={{ padding: '8px 0' }}>
          <SectionTitle icon={<ShopOutlined />} title="Company Mappings" />
          <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
        <span style={{ fontSize: 15, padding: '0 8px' }}><FileOutlined style={{ marginRight: 8 }} />Documents</span>
      ),
      children: (
        <div style={{ padding: '8px 0' }}>
          <SectionTitle icon={<FileOutlined />} title="Product Documents" />
          <DocumentsPanel 
            entityType="PRODUCT" 
            entityId={product.product_id} 
            canUpload={product.created_by === currentUser?.user_id || currentUser?.role?.role_name === 'SUPER_ADMIN'}
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