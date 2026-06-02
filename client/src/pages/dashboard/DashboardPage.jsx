import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Empty } from 'antd';
import {
  ShoppingOutlined, BankOutlined, TeamOutlined, LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { useDashboardStats, useDashboardActivity } from '../../api/dashboardApi';

const { Title, Text } = Typography;

// Color palette for stat cards
const STAT_CARDS = [
  { key: 'totalProducts', title: 'Active Products', icon: <ShoppingOutlined />, color: '#1890ff', bg: '#e6f7ff' },
  { key: 'totalCompanies', title: 'Active Companies', icon: <BankOutlined />, color: '#52c41a', bg: '#f6ffed' },
  { key: 'totalContacts', title: 'Active Contacts', icon: <TeamOutlined />, color: '#fa8c16', bg: '#fff7e6' },
  { key: 'activeMappings', title: 'Active Mappings', icon: <LinkOutlined />, color: '#722ed1', bg: '#f9f0ff' },
];

// Colors for company type chart bars
const TYPE_COLORS = {
  MANUFACTURER: '#1890ff',
  SUPPLIER: '#52c41a',
  BUYER: '#fa8c16',
  DISTRIBUTOR: '#722ed1',
};

const ACTION_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activityLoading } = useDashboardActivity(50);

  // Calculate total for percentage display
  const totalByType = (stats?.companiesByType || []).reduce((sum, g) => sum + g.count, 0);

  const activityColumns = [
    {
      title: 'User', key: 'user', width: 140,
      render: (_, r) => <Text strong>{r.user?.name || 'Unknown'}</Text>
    },
    {
      title: 'Action', key: 'action', width: 100,
      render: (_, r) => <Tag color={ACTION_COLORS[r.action_type] || 'default'}>{r.action_type}</Tag>
    },
    {
      title: 'Module', key: 'module', width: 140,
      render: (_, r) => <Tag>{r.module_name}</Tag>
    },
    {
      title: 'Record ID', dataIndex: 'record_id', key: 'record_id', width: 100,
      render: (v) => v || '—'
    },
    {
      title: 'Time', key: 'time', width: 180,
      render: (_, r) => new Date(r.created_at).toLocaleString()
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview and key metrics"
        breadcrumbs={['Dashboard']}
      />

      {/* KPI Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                background: card.bg,
                borderLeft: `4px solid ${card.color}`,
              }}
            >
              <Statistic
                title={<span style={{ color: '#595959', fontSize: 14 }}>{card.title}</span>}
                value={statsLoading ? '...' : (stats?.[card.key] ?? 0)}
                prefix={<span style={{ color: card.color, fontSize: 24 }}>{card.icon}</span>}
                valueStyle={{ color: card.color, fontWeight: 700, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Companies by Type */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 600 }}>Companies by Type</span>}
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : (stats?.companiesByType || []).length === 0 ? (
              <Empty description="No companies yet" />
            ) : (
              <div>
                {(stats?.companiesByType || []).map((group) => {
                  const percentage = totalByType > 0 ? Math.round((group.count / totalByType) * 100) : 0;
                  return (
                     <div key={group.type} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>{group.type}</Text>
                        <Text strong>{group.count} ({percentage}%)</Text>
                      </div>
                      <div style={{
                        height: 8, borderRadius: 4, background: '#f0f0f0',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${percentage}%`,
                          background: TYPE_COLORS[group.type] || '#1890ff',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 600 }}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Recent Activities
              </span>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <Table
              columns={activityColumns}
              dataSource={activities || []}
              loading={activityLoading}
              rowKey="log_id"
              pagination={{
                pageSize: 5,
                size: 'small',
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                simple: false,
              }}
              size="small"
              locale={{ emptyText: 'No activities yet' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
