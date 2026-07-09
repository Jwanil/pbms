import { Tag } from 'antd';
import { CheckCircleOutlined, StopOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';

const ENQUIRY_STATUS_CONFIG = {
  OPEN:        { color: 'blue',    icon: <ClockCircleOutlined />,  label: 'Open' },
  IN_PROGRESS: { color: 'orange',  icon: <SyncOutlined spin />,    label: 'In Progress' },
  RESOLVED:    { color: 'success', icon: <CheckCircleOutlined />,  label: 'Resolved' },
};

function StatusBadge({ status }) {
  // Enquiry statuses
  if (ENQUIRY_STATUS_CONFIG[status]) {
    const { color, icon, label } = ENQUIRY_STATUS_CONFIG[status];
    return <Tag icon={icon} color={color}>{label}</Tag>;
  }
  // Original product/company statuses
  if (status === 0 || status === 'ACTIVE') {
    return <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>;
  }
  return <Tag icon={<StopOutlined />} color="default">Inactive</Tag>;
}

export default StatusBadge;
