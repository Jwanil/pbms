import React from 'react';
import './styles/ViewDrawerShared.css';
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
  <div className="drawer-section-heading">
    <span className="drawer-section-heading__icon">{icon}</span>
    <Title level={5} className="drawer-section-heading__title">{title}</Title>
  </div>
);

const InfoGrid = ({ items }) => (
  <Row gutter={[16, 8]} className="drawer-fields-row">
    {items.map(({ label, value, span = 12 }) => (
      <Col span={span} key={label}>
        <div style={{
          background: '#fff',
          border: '1px solid #e8edf5',
          borderRadius: 8,
          padding: '10px 14px',
          height: '100%',
        }}>
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
      render: (r) => <Tag color="purple" className="drawer-tag">{r}</Tag>,
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
      label: <span><InfoCircleOutlined className="drawer-tab-icon" />Company Details</span>,
      children: (
        <div>
          <SectionTitle icon={<BankOutlined />} title="Company Information" />
          <InfoGrid items={[
            { label: 'Company Name', value: company.company_name },
            {
              label: 'Type',
              value: <Tag color={COMPANY_TYPE_COLORS[company.company_type] || 'default'} className="drawer-tag">{company.company_type}</Tag>,
            },
            { label: 'Email', value: company.email },
            { label: 'Phone', value: company.phone },
            { label: 'Website', value: company.website },
            { label: 'Industry Type', value: company.industry_type },
          ]} />

          <Divider className="drawer-divider" />
          <SectionTitle icon={<InfoCircleOutlined />} title="Location" />
          <InfoGrid items={[
            { label: 'Country', value: company.country },
            { label: 'State', value: company.state },
            { label: 'City', value: company.city },
            { label: 'Address', value: company.address, span: 24 },
          ]} />

          <Divider className="drawer-divider" />
          <SectionTitle icon={<InfoCircleOutlined />} title="Registration Details" />
          <InfoGrid items={[
            { label: 'GST Number', value: company.gst_number },
            { label: 'PAN Number', value: company.pan_number },
            { label: 'CIN Number', value: company.cin_number },
            { label: 'Status', value: <StatusBadge status={company.status_flag} /> },
          ]} />

          <InfoGrid items={[
            { label: 'Remarks', value: company.remarks, span: 24 },
          ]} />

          <Divider className="drawer-divider" />
          <InfoGrid items={[
            { label: 'Total Contacts', value: company._count?.contacts || 0 },
            { label: 'Created At', value: dayjs(company.created_at).format('DD MMM YYYY, HH:mm') },
          ]} />
        </div>
      ),
    },
    {
      key: 'branches',
      label: <span><ApartmentOutlined className="drawer-tab-icon" />Branches ({(company.branches || []).length})</span>,
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
            className="drawer-table-card"
          />
        </div>
      ),
    },
    {
      key: 'products',
      label: <span><InfoCircleOutlined className="drawer-tab-icon" />Mapped Products ({(company.mappings || []).length})</span>,
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
            className="drawer-table-card"
          />
        </div>
      ),
    },
    {
      key: 'documents',
      label: <span><FileOutlined className="drawer-tab-icon" />Documents</span>,
      children: (
        <div>
          <SectionTitle icon={<FileOutlined />} title="Company Documents" />
          <DocumentsPanel 
            entityType="COMPANY" 
            entityId={company.company_id} 
            canUpload={company.created_by === currentUser?.user_id || currentUser?.role === 'SUPER_ADMIN'}
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
