import React from 'react';
import { Tabs, Descriptions, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useCompany } from '../api/companiesApi';

const CompanyViewDrawer = ({ companyId, open, onClose }) => {
  const { data: company, isLoading } = useCompany(companyId);

  if (!company) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Company Details" />;

  const tabs = [
    {
      key: 'details',
      label: 'Company Details',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Company Name">{company.company_name}</Descriptions.Item>
          <Descriptions.Item label="Type"><Tag>{company.company_type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Status"><StatusBadge status={company.status} /></Descriptions.Item>
          <Descriptions.Item label="Email">{company.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{company.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="GST Number">{company.gst_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="PAN Number">{company.pan_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="CIN Number">{company.cin_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="Website">{company.website || '-'}</Descriptions.Item>
          <Descriptions.Item label="Industry Type">{company.industry_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="Total Contacts">{company._count?.contacts || 0}</Descriptions.Item>
          <Descriptions.Item label="Created At">{dayjs(company.created_at).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{company.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>{company.remarks || '-'}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'branches',
      label: 'Branches',
      children: (
        <Table 
          dataSource={company.branches || []}
          rowKey="branch_id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Branch Name', dataIndex: 'branch_name' },
            { title: 'GST', dataIndex: 'gst_number', render: (val) => val || '-' },
            { title: 'City', dataIndex: 'city', render: (val) => val || '-' },
            { title: 'State', dataIndex: 'state', render: (val) => val || '-' },
            { title: 'Pincode', dataIndex: 'pincode', render: (val) => val || '-' },
            { title: 'Contact', dataIndex: 'contact_number', render: (val) => val || '-' },
            { title: 'Email', dataIndex: 'email', render: (val) => val || '-' },
          ]}
        />
      )
    },
    {
      key: 'products',
      label: 'Mapped Products',
      children: (
        <Table 
          dataSource={company.mappings || []}
          rowKey="mapping_id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Product Name', dataIndex: ['product', 'product_name'] },
            { title: 'SKU', dataIndex: ['product', 'sku'] },
            { title: 'Role Type', dataIndex: 'role_type' },
            { title: 'Status', dataIndex: 'is_active', render: (active) => <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} /> },
          ]}
        />
      )
    }
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Company: ${company.company_name}`}>
      <Tabs defaultActiveKey="details" items={tabs} />
    </ViewDrawer>
  );
};

export default CompanyViewDrawer;