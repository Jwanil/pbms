/**
 * EnquiryDetailPage.jsx
 * Full detail view of a single enquiry — used by both regular users (from My Queries)
 * and admins (from the admin table). Reads the :id param from the URL.
 */

import { useParams, useNavigate } from 'react-router-dom';
import './Enquiries.css';
import {
  Card, Tag, Table, Typography, Descriptions, Button, Space, Spin, Result, Divider
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEnquiry } from '../../api/enquiryApi';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';


const { Text, Paragraph } = Typography;

const MODULE_LABELS = {
  PRODUCT:    'Product',
  COMPANY:    'Company',
  MAPPING:    'Mapping',
  PERMISSION: 'Permissions',
  ROLE:       'Roles',
  MASTERS:    'Masters',
};

const MODULE_COLORS = {
  PRODUCT:    'blue',
  COMPANY:    'purple',
  MAPPING:    'cyan',
  PERMISSION: 'orange',
  ROLE:       'red',
  MASTERS:    'green',
};

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: enquiry, isLoading, isError } = useEnquiry(Number(id));

  if (isLoading) {
    return (
      <div className="enquiries-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !enquiry) {
    return (
      <Result
        status="404"
        title="Enquiry Not Found"
        subTitle="The enquiry you're looking for doesn't exist or you don't have access."
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        }
      />
    );
  }

  return (
    <div className="enquiry-detail-page">
      <PageHeader
        title={enquiry.enquiry_name}
        subtitle="Enquiry Details"
        breadcrumbs={['Enquiries', 'Details']}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <Card>
        <Descriptions column={1} bordered size="small" labelStyle={{ width: 160 }}>
          <Descriptions.Item label="Subject">
            <Text strong>{enquiry.enquiry_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Module">
            <Tag color={MODULE_COLORS[enquiry.module_type]}>
              {MODULE_LABELS[enquiry.module_type] || enquiry.module_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Reference ID">
            {enquiry.reference_id ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <StatusBadge status={enquiry.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Submitted By">
            <Space direction="vertical" size={0}>
              <Text strong>{enquiry.user?.name}</Text>
              <Text type="secondary" className="enquiry-user-email">{enquiry.user?.email}</Text>
              <Tag className="enquiry-user-role-tag">{enquiry.user?.role?.role_name}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted On">
            {dayjs(enquiry.created_at).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
          {enquiry.status === 'RESOLVED' && enquiry.responded_at && (
            <Descriptions.Item label="Resolved On">
              {dayjs(enquiry.responded_at).format('MMM D, YYYY h:mm A')}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider orientation="left">Description</Divider>
        {enquiry.module_type === 'PERMISSION' && enquiry.requested_permissions?.length > 0 && 
        (
          <>
              <Divider orientation="left">Requested Permissions</Divider>
              <Table
                  dataSource={enquiry.requested_permissions.map(r => ({ ...r, key: r.module }))}
                  pagination={false}
                  size="small"
                  columns={[
                      {
                          title: 'Module',
                          dataIndex: 'module',
                          render: (m) => (
                              <span className="module-name-capitalize">
                                  {m.replace(/_/g, ' ')}
                              </span>
                          ),
                      },
                      ...['can_view', 'can_create', 'can_edit', 'can_delete'].map(a => ({
                          title: a.replace('can_', '').replace(/^\w/, c => c.toUpperCase()),
                          dataIndex: a,
                          align: 'center',
                          render: (v) => v
                              ? <Tag color="blue">✓ Yes</Tag>
                              : <Tag color="default">—</Tag>,
                      })),
                  ]}
              />
          </>
      )}

        <Paragraph className="enquiry-description">
          {enquiry.description}
        </Paragraph>

        {enquiry.response && (
          <>
            <Divider orientation="left">Admin Response</Divider>
            <div className="enquiry-response-block">
              <Text strong className="enquiry-response-block__title">
                Response from Admin
              </Text>
              <Paragraph className="enquiry-response-block__text">
                {enquiry.response}
              </Paragraph>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
