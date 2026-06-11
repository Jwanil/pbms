import React from 'react';
import { Tabs, Descriptions, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import ViewDrawer from './ViewDrawer';
import StatusBadge from './StatusBadge';
import { useContact } from '../api/contactsApi';

const ContactViewDrawer = ({ contactId, open, onClose }) => {
  const { data: contact, isLoading } = useContact(contactId);

  if (!contact) return <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Contact Details" />;

  let tagsArray = [];
  try {
    if (contact.tags) tagsArray = JSON.parse(contact.tags);
  } catch (e) {
    // ignore parse error if it's not a valid JSON array
  }

  const tabs = [
    {
      key: 'personal',
      label: 'Personal Details',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Full Name">{`${contact.first_name} ${contact.last_name || ''}`.trim()}</Descriptions.Item>
          <Descriptions.Item label="Mobile">{contact.mobile}</Descriptions.Item>
          <Descriptions.Item label="Alternate Mobile">{contact.alternate_mobile || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{contact.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Designation">{contact.designation || '-'}</Descriptions.Item>
          <Descriptions.Item label="Contact Type"><Tag>{contact.contact_type || '-'}</Tag></Descriptions.Item>
          <Descriptions.Item label="Preferred Language">{contact.preferred_language || '-'}</Descriptions.Item>
          <Descriptions.Item label="Status"><StatusBadge status={contact.status} /></Descriptions.Item>
          <Descriptions.Item label="Tags" span={2}>
            {tagsArray.length > 0 ? tagsArray.map(t => <Tag key={t}>{t}</Tag>) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>{dayjs(contact.created_at).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'company',
      label: 'Company & Branch',
      children: (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Company Name">{contact.company?.company_name || '— Not assigned —'}</Descriptions.Item>
          <Descriptions.Item label="Branch Name">{contact.branch?.branch_name || '— No branch —'}</Descriptions.Item>
          <Descriptions.Item label="Branch City">{contact.branch?.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="Branch State">{contact.branch?.state || '-'}</Descriptions.Item>
          <Descriptions.Item label="Branch Email">{contact.branch?.email || '-'}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'interests',
      label: 'Product Interests',
      children: (
        <Table 
          dataSource={contact.interests || []}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'No product interests recorded' }}
          columns={[
            { title: 'Product Name', dataIndex: ['product', 'product_name'] },
            { title: 'SKU', dataIndex: ['product', 'sku'] },
          ]}
        />
      )
    }
  ];

  return (
    <ViewDrawer open={open} onClose={onClose} loading={isLoading} title="Contact Details">
      <Tabs defaultActiveKey="personal" items={tabs} />
    </ViewDrawer>
  );
};

export default ContactViewDrawer;