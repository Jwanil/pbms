import { Typography, Breadcrumb } from 'antd';

const { Title } = Typography;

function PageHeader({ title, subtitle, breadcrumbs = [], extra }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs.map((b) => ({ title: b }))}
          style={{ marginBottom: 8 }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1F3A6E' }}>{title}</Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{subtitle}</Typography.Text>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
