import { Table, Tag, Button, Typography, Space } from 'antd';
import './Enquiries.css';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMyEnquiries } from '../../api/enquiryApi';
import StatusBadge from '../../components/StatusBadge';
import dayjs from 'dayjs';

const { Title } = Typography;

const MODULE_COLORS = {
  PRODUCT:    'blue',
  COMPANY:    'purple',
  MAPPING:    'cyan',
  PERMISSION: 'orange',
  ROLE:       'magenta',
  MASTERS:    'green',
};

export default function MyQueriesPage() {
  const navigate = useNavigate();
  const { data: queries = [], isLoading } = useMyEnquiries();

  const columns = [
    {
      title: 'Title',
      dataIndex: 'enquiry_name',
      key: 'enquiry_name',
      width: 280,
      ellipsis: true,
    },
    {
      title: 'Module',
      dataIndex: 'module_type',
      key: 'module_type',
      width: 120,
      render: (v) => (
        <Tag color={MODULE_COLORS[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: 'Submitted On',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? dayjs(v).format('DD MMM YYYY, h:mm A') : '—',
    },
    {
      title: 'Resolved On',
      dataIndex: 'responded_at',
      key: 'responded_at',
      width: 160,
      render: (_, r) => r.status === 'RESOLVED' && r.responded_at ? dayjs(r.responded_at).format('DD MMM YYYY, h:mm A') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/enquiries/${record.enquiry_id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="my-queries-header">
        <Title level={4} className="my-queries-title">My Queries</Title>
      </div>

      <Table
        columns={columns}
        dataSource={queries}
        loading={isLoading}
        rowKey="enquiry_id"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 940 }}
        locale={{ emptyText: "You haven't submitted any queries yet." }}
      />
    </div>
  );
}
