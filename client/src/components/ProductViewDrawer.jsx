import React from 'react';
import { Tabs, Descriptions, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useProduct } from '../api/productsApi';

const ProductViewDrawer = ({ productId, open, onClose }) => {
  const { data: product, isLoading } = useProduct(productId);

  if (!product) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Product Details" />;

  const tabs = [
    {
      key: 'details',
      label: 'Product Details',
      children: (
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Product Name">{product.product_name}</Descriptions.Item>
          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
          <Descriptions.Item label="Status"><StatusBadge status={product.status} /></Descriptions.Item>
          <Descriptions.Item label="Category">{product.category?.category_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Grade">{product.grade?.grade_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Packaging">{product.packaging?.packaging_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Unit of Measure">{product.unit_of_measure || '-'}</Descriptions.Item>
          <Descriptions.Item label="Shelf Life">{product.shelf_life || '-'}</Descriptions.Item>
          <Descriptions.Item label="Molecular Formula">{product.molecular_formula || '-'}</Descriptions.Item>
          <Descriptions.Item label="Molecular Weight">{product.molecular_weight || '-'}</Descriptions.Item>
          <Descriptions.Item label="Purity">{product.purity || '-'}</Descriptions.Item>
          <Descriptions.Item label="Process Type">{product.process_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="UN Number">{product.un_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="HSN Code">{product.hsn_code || '-'}</Descriptions.Item>
          <Descriptions.Item label="CAS Number">{product.cas_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="Industry Application" span={2}>{product.industry_application || '-'}</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{product.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created By">{product.creator?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created At">{dayjs(product.created_at).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'business',
      label: 'Business Info',
      children: (
        <Table 
          dataSource={product.mappings || []}
          rowKey="mapping_id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Company Name', dataIndex: ['company', 'company_name'] },
            { title: 'Type', dataIndex: ['company', 'company_type'], render: (type) => <Tag>{type}</Tag> },
            { title: 'Role Type', dataIndex: 'role_type' },
            { title: 'MOQ', dataIndex: 'moq' },
            { title: 'Price Range', render: (_, r) => `${r.price_range_min || '-'} to ${r.price_range_max || '-'}` },
            { title: 'Status', dataIndex: 'is_active', render: (active) => <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} /> },
          ]}
        />
      )
    },
    {
      key: 'companies',
      label: 'Mapped Companies',
      children: (
        <Table 
          dataSource={product.mappings || []}
          rowKey="mapping_id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Company Name', dataIndex: ['company', 'company_name'] },
            { title: 'Type', dataIndex: ['company', 'company_type'], render: (type) => <Tag color="blue">{type}</Tag> },
            { title: 'Role Type', dataIndex: 'role_type' },
            { title: 'MOQ', dataIndex: 'moq' },
            { title: 'Price Range', render: (_, r) => `${r.price_range_min || '-'} to ${r.price_range_max || '-'}` },
            { title: 'Lead Time (Days)', dataIndex: 'lead_time_days' },
            { title: 'Status', dataIndex: 'is_active', render: (active) => <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} /> },
          ]}
        />
      )
    }
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Product: ${product.product_name}`}>
      <Tabs defaultActiveKey="details" items={tabs} />
    </ViewDrawer>
  );
};

export default ProductViewDrawer;