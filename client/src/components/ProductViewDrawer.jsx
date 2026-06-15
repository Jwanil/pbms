import React from 'react';
import { Tabs, Tag, Table, Divider, Typography, Row, Col } from 'antd';
import {
  InfoCircleOutlined, ShopOutlined, BarcodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useProduct } from '../api/productsApi';

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

const ProductViewDrawer = ({ productId, open, onClose }) => {
  const { data: product, isLoading } = useProduct(productId);

  if (!product) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Product Details" />;

  const mappingColumns = [
    {
      title: 'Company',
      dataIndex: ['company', 'company_name'],
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: ['company', 'company_type'],
      render: (type) => <Tag color="blue" style={{ borderRadius: 4 }}>{type}</Tag>,
    },
    {
      title: 'Role',
      dataIndex: 'role_type',
      render: (role) => <Tag color="purple" style={{ borderRadius: 4 }}>{role}</Tag>,
    },
    {
      title: 'MOQ',
      dataIndex: 'moq',
      render: (val) => val ? Number(val).toLocaleString() : '—',
    },
    {
      title: 'Price Range',
      render: (_, r) => {
        const min = r.price_range_min ? `₹${Number(r.price_range_min).toLocaleString()}` : null;
        const max = r.price_range_max ? `₹${Number(r.price_range_max).toLocaleString()}` : null;
        if (!min && !max) return <Text type="secondary">—</Text>;
        return `${min || '?'} – ${max || '?'}`;
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
        <span><InfoCircleOutlined style={{ marginRight: 6 }} />Product Details</span>
      ),
      children: (
        <div>
          <SectionTitle icon={<BarcodeOutlined />} title="Identity" />
          <InfoGrid items={[
            { label: 'Product Name', value: product.product_name },
            { label: 'SKU', value: product.sku },
            { label: 'CAS Number', value: product.cas_number },
            { label: 'Composition', value: product.composition },
            { label: 'Category', value: product.category?.category_name },
            { label: 'Grade', value: product.grade?.grade_name },
            { label: 'Packaging', value: product.packaging ? `${product.packaging.packaging_name} (${product.packaging.size_value} ${product.packaging.size_unit})` : null },
            { label: 'Unit of Measure', value: product.unit_of_measure },
          ]} />

          <Divider style={{ margin: '16px 0' }} />
          <SectionTitle icon={<InfoCircleOutlined />} title="Technical Details" />
          <InfoGrid items={[
            { label: 'Molecular Formula', value: product.molecular_formula },
            { label: 'Molecular Weight', value: product.molecular_weight },
            { label: 'Purity', value: product.purity ? `${product.purity}%` : null },
            { label: 'Process Type', value: product.process_type },
            { label: 'Shelf Life', value: product.shelf_life },
            { label: 'UN Number', value: product.un_number },
            { label: 'HSN Code', value: product.hsn_code },
            { label: 'Status', value: <StatusBadge status={product.status} /> },
          ]} />

          {(product.industry_application || product.description) && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <SectionTitle icon={<InfoCircleOutlined />} title="Description" />
              <InfoGrid items={[
                ...(product.industry_application ? [{ label: 'Industry Application', value: product.industry_application, span: 24 }] : []),
                ...(product.description ? [{ label: 'Description', value: product.description, span: 24 }] : []),
              ]} />
            </>
          )}

          <Divider style={{ margin: '16px 0' }} />
          <InfoGrid items={[
            { label: 'Created By', value: product.creator?.name },
            { label: 'Created At', value: dayjs(product.created_at).format('DD MMM YYYY, HH:mm') },
          ]} />
        </div>
      ),
    },
    {
      key: 'companies',
      label: (
        <span><ShopOutlined style={{ marginRight: 6 }} />Mapped Companies ({(product.mappings || []).length})</span>
      ),
      children: (
        <div>
          <SectionTitle icon={<ShopOutlined />} title="Company Mappings" />
          <Table
            dataSource={product.mappings || []}
            rowKey="mapping_id"
            pagination={false}
            size="middle"
            locale={{ emptyText: 'No companies mapped to this product' }}
            columns={mappingColumns}
            style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8edf5' }}
          />
        </div>
      ),
    },
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Product: ${product.product_name}`}>
      <Tabs defaultActiveKey="details" items={tabs} tabBarStyle={{ marginBottom: 16 }} />
    </ViewDrawer>
  );
};

export default ProductViewDrawer;
