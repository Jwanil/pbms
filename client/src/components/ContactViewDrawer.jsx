import React from 'react';
import './styles/ViewDrawerShared.css';
import { Tabs, Tag, Table, Divider, Typography, Row, Col } from 'antd';
import {
  UserOutlined, BankOutlined, StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useContact } from '../api/contactsApi';

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

const CONTACT_TYPE_COLORS = {
  BUYER: 'orange', PURCHASE_MANAGER: 'blue', SALES: 'green', ADMIN: 'purple',
};

const ContactViewDrawer = ({ contactId, open, onClose }) => {
  const { data: contact, isLoading } = useContact(contactId);

  if (!contact) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Contact Details" />;

  let tagsArray = [];
  try {
    if (contact.tags) tagsArray = JSON.parse(contact.tags);
  } catch (e) { /* ignore */ }

  const productColumns = [
    {
      title: '#',
      render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
      width: 50,
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'product_name'],
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      render: (v) => <Tag className="drawer-tag">{v}</Tag>,
    },
  ];

  const tabs = [
    {
      key: 'personal',
      label: <span><UserOutlined className="drawer-tab-icon" />Personal Details</span>,
      children: (
        <div>
          <SectionTitle icon={<UserOutlined />} title="Contact Information" />
          <InfoGrid items={[
            { label: 'Full Name', value: `${contact.first_name} ${contact.last_name || ''}`.trim() },
            { label: 'Status', value: <StatusBadge status={contact.status_flag} /> },
            { label: 'Mobile', value: contact.mobile },
            { label: 'Alternate Mobile', value: contact.alternate_mobile },
            { label: 'Email', value: contact.email },
            { label: 'Designation', value: contact.designation },
            {
              label: 'Contact Type',
              value: contact.contact_type
                ? <Tag color={CONTACT_TYPE_COLORS[contact.contact_type] || 'default'} className="drawer-tag">{contact.contact_type.replace('_', ' ')}</Tag>
                : null,
            },
            { label: 'Preferred Language', value: contact.preferred_language },
          ]} />

          {tagsArray.length > 0 && (
            <>
              <Divider className="drawer-divider" />
              <SectionTitle icon={<StarOutlined />} title="Tags" />
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid #e8edf5', borderRadius: 8 }}>
                {tagsArray.map(t => (
                  <Tag key={t} style={{ borderRadius: 4, marginBottom: 4 }}>{t}</Tag>
                ))}
              </div>
            </>
          )}

          <Divider className="drawer-divider" />
          <InfoGrid items={[
            { label: 'Created At', value: dayjs(contact.created_at).format('DD MMM YYYY, HH:mm') },
            { label: 'Updated At', value: contact.updated_at ? dayjs(contact.updated_at).format('DD MMM YYYY, HH:mm') : null },
          ]} />
        </div>
      ),
    },
    {
      key: 'company',
      label: <span><BankOutlined className="drawer-tab-icon" />Company & Branch</span>,
      children: (
        <div>
          <SectionTitle icon={<BankOutlined />} title="Associated Company" />
          <InfoGrid items={[
            { label: 'Company Name', value: contact.company?.company_name, span: 24 },
          ]} />

          <Divider className="drawer-divider" />
          <SectionTitle icon={<BankOutlined />} title="Branch Details" />
          <InfoGrid items={[
            { label: 'Branch Name', value: contact.branch?.branch_name, span: 24 },
            { label: 'City', value: contact.branch?.city },
            { label: 'State', value: contact.branch?.state },
            { label: 'Pincode', value: contact.branch?.pincode },
            { label: 'Branch Email', value: contact.branch?.email },
          ]} />
        </div>
      ),
    },
    {
      key: 'interests',
      label: <span><StarOutlined className="drawer-tab-icon" />Product Interests ({(contact.interests || []).length})</span>,
      children: (
        <div>
          <SectionTitle icon={<StarOutlined />} title="Product Interests" />
          <Table
            dataSource={contact.interests || []}
            rowKey="id"
            pagination={false}
            size="middle"
            locale={{ emptyText: 'No product interests recorded' }}
            columns={productColumns}
            className="drawer-table-card"
          />
        </div>
      ),
    },
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title={`Contact: ${contact.first_name} ${contact.last_name || ''}`.trim()}>
      <Tabs defaultActiveKey="personal" items={tabs} tabBarStyle={{ marginBottom: 16 }} />
    </ViewDrawer>
  );
};

export default ContactViewDrawer;
