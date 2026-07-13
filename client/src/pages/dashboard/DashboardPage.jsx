import './DashboardPage.css';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Empty } from 'antd';
import {
  ShoppingOutlined, BankOutlined, TeamOutlined, LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { useDashboardStats, useDashboardActivity } from '../../api/dashboardApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

import { STAT_CARDS, TYPE_COLORS, ACTION_COLORS } from '../../utils/constants';

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

  const topCompaniesColumns = [
    { title: 'Company Name', dataIndex: 'name', key: 'name' },
    { title: 'Branches', dataIndex: 'branches', key: 'branches', render: (val) => <Tag color="blue">{val}</Tag> }
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview and key metrics"
        breadcrumbs={['Dashboard']}
      />

      {/* KPI Stat Cards */}
      <Row gutter={[16, 16]} className="db-kpi-row">
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              variant="borderless"
              className="db-stat-card"
              style={{ background: card.bg, borderLeft: `4px solid ${card.color}` }}
            >
              <Statistic
                title={<span className="db-stat-title">{card.title}</span>}
                value={statsLoading ? '...' : (stats?.[card.key] ?? 0)}
                prefix={<span className="db-stat-icon" style={{ color: card.color }}>{card.icon ? <card.icon /> : null}</span>}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Companies by Type */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className="db-card-title">Companies by Type</span>}
            variant="borderless"
            className="db-card--full-height"
          >
            {statsLoading ? (
              <div className="db-spin-center"><Spin /></div>
            ) : (stats?.companiesByType || []).length === 0 ? (
              <Empty description="No companies yet" />
            ) : (
              <div>
                {(stats?.companiesByType || []).map((group) => {
                  const percentage = totalByType > 0 ? Math.round((group.count / totalByType) * 100) : 0;
                  return (
                     <div key={group.type} className="db-type-group">
                      <div className="db-type-label-row">
                        <Text>{group.type}</Text>
                        <Text strong>{group.count} ({percentage}%)</Text>
                      </div>
                      <div className="db-progress-track">
                        <div
                          className="db-progress-fill"
                          style={{
                            width: `${percentage}%`,
                            background: TYPE_COLORS[group.type] || '#1890ff',
                          }}
                        />
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
              <span className="db-card-title">
                <ClockCircleOutlined className="db-card-title-icon" />
                Recent Activities
              </span>
            }
            variant="borderless"
            className="db-card"
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

      <Row gutter={[16, 16]} className="db-charts-row">
        <Col xs={24} lg={12}>
          <Card title="Product Additions (Last 6 Months)" variant="borderless" className="db-card">
            <div className="db-chart-wrapper">
              {statsLoading ? <Spin /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.productTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Companies (By Branches)" variant="borderless" className="db-card">
            <Table
              columns={topCompaniesColumns}
              dataSource={stats?.topCompanies || []}
              loading={statsLoading}
              rowKey="name"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No companies yet' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
