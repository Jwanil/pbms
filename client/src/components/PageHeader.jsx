import { Typography, Breadcrumb } from 'antd';
import './styles/PageHeader.css';

const { Title } = Typography;

function PageHeader({ title, subtitle, breadcrumbs = [], extra }) {
  return (
    <div className="page-header">
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs.map((b) => ({ title: b }))}
          className="page-header__breadcrumb"
        />
      )}
      <div className="page-header__row">
        <div>
          <Title level={4} className="page-header__title">{title}</Title>
          {subtitle && (
            <Typography.Text type="secondary" className="page-header__subtitle">{subtitle}</Typography.Text>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
