import { Tag } from 'antd';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

function StatusBadge({ status }) {
  if (status === 'ACTIVE') {
    return <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>;
  }
  return <Tag icon={<StopOutlined />} color="default">Inactive</Tag>;
}

export default StatusBadge;
