import React from 'react';
import { Tabs, Tag, Table, Divider, Typography, Row, Col } from 'antd';
import {
  InfoCircleOutlined, BankOutlined, ApartmentOutlined, FileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useCompany } from '../api/companiesApi';
import DocumentsPanel from './DocumentsPanel';
import useAuthStore from '../store/authStore';

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

const COMPANY_TYPE_COLORS = {
  MANUFACTURER: 'blue', SUPPLIER: 'green', BUYER: 'orange', DISTRIBUTOR: 'purple',
};

const CompanyViewDrawer = ({ companyId, open, onClose }) => {
  const { data: company, isLoading } = useCompany(companyId);
  const currentUser = useAuthStore((state) => state.user);

  if (!company) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Company Details" />;

  const branchColumns = [
    { title: 'Branch Name', dataIndex: 'branch_name', render: (v) => <Text strong>{v}</Text> },
    { title: 'GST', dataIndex: 'gst_number', render: (v) => v || '—' },
    { title: 'City', dataIndex: 'city', render: (v) => v || '—' },
    { title: 'State', dataIndex: 'state', render: (v) => v || '—' },
    { title: 'Pincode', dataIndex: 'pincode', render: (v) => v || '—' },
    { title: 'Contact', dataIndex: 'contact_number', render: (v) => v || '—' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
  ];

  const productColumns = [
    { title: 'Product Name', dataIndex: ['product', 'product_name'], render: (v) => <Text strong>{v}</Text> },
    { title: 'SKU', dataIndex: ['product', 'sku'], render: (v) => <Tag>{v}</Tag> },
    {
      title: 'Role',
      dataIndex: 'role_type',
      render: (r) => <Tag color="purple" style={{ borderRadius: 4 }}>{r}</Tag>,
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
      label: <span><InfoCircleOutlined style={{ marginRight: 6 }} />Company Details</span>,
      children: (
        <div>
          <SectionTitle icon={<BankOutlined />} title="Company Information" />
          <InfoGrid items={[
            { label: 'Company Name', value: company.company_name },
            {
              label: 'Type',
              value: <Tag color={COMPANY_TYPE_COLORS[company.company_type] || 'default'} style={{ borderRadius: 4 }}>{company.company_type}</Tag>,
            },
            { label: 'Email', value: company.email },
            { label: 'Phone', value: company.phone },
            { label: 'Website', value: company.website },
            { label: 'Industry Type', value: company.industry_type },
          ]} />

          <Divider style={{ margin: '16px 0' }} />
          <SectionTitle icon={<InfoCircleOutlined />} title="Registration Details" />
          <InfoGrid items={[
            { label: 'GST Number', value: company.gst_number },
            { label: 'PAN Number', value: company.pan_number },
            { label: 'CIN Number', value: company.cin_number },
            { label: 'Status', value: <StatusBadge status={company.status} /> },
          ]} />

          <Divider style={{ margin: '16px 0' }} />
          <InfoGrid items={[
            { label: 'Address', value: company.address, span: 24 },
            { label: 'Remarks', value: company.remarks, span: 24 },
          ]} />

          <Divider style={{ margin: '16px 0' }} />
          <InfoGrid items={[
            { label: 'Total Contacts', value: company._count?.contacts || 0 },
            { label: 'Created At', value: dayjs(company.created_at).format('DD MMM YYYY, HH:mm') },
          ]} />
        </div>
      ),
    },
    {
      key: 'branches',
      label: <span><ApartmentOutlined style={{ marginRight: 6 }} />Branches ({(company.branches || []).length})</span>,
      children: (
        <div>
          <SectionTitle icon={<ApartmentOutlined />} title="Branch Offices" />
          <Table
            dataSource={company.branches || []}
            rowKey="branch_id"
            pagination={false}
            size="middle"
            locale={{ emptyText: 'No branches added' }}
            columns={branchColumns}
            style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8edf5' }}
          />
        </div>
      ),
    },
    {
      key: 'products',
      label: <span><InfoCircleOutlined style={{ marginRight: 6 }} />Mapped Products ({(company.mappings || []).length})</span>,
      children: (
        <div>
          <SectionTitle icon={<InfoCircleOutlined />} title="Product Mappings" />
          <Table
            dataSource={company.mappings || []}
            rowKey="mapping_id"
            pagination={false}
            size="middle"
            locale={{ emptyText: 'No products mapped' }}
            columns={productColumns}
            style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8edf5' }}
          />
        </div>
      ),
    },
    {
      key: 'documents',
      label: <span><FileOutlined style={{ marginRight: 6 }} />Documents</span>,
      children: (
        <div>
          <SectionTitle icon={<FileOutlined />} title="Company Documents" />
          <DocumentsPanel 
            entityType="COMPANY" 
            entityId={company.company_id} 
            canUpload={company.created_by === currentUser?.user_id || currentUser?.role?.role_name === 'SUPER_ADMIN'}
          />
        </div>
      ),
    },
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Company: ${company.company_name}`}>
      <Tabs defaultActiveKey="details" items={tabs} tabBarStyle={{ marginBottom: 16 }} />
    </ViewDrawer>
  );
};

export default CompanyViewDrawer;
