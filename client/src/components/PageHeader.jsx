import { Typography, Breadcrumb } from 'antd';
import './styles/PageHeader.css';

const { Title } = Typography;

import { useEffect } from 'react';
import useLayoutStore from '../store/useLayoutStore';

function PageHeader({ title, subtitle, breadcrumbs = [], extra }) {
  const setPageHeader = useLayoutStore((state) => state.setPageHeader);

  useEffect(() => {
    setPageHeader(title, subtitle, breadcrumbs);
  }, [title, subtitle, breadcrumbs, setPageHeader]);

  return (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="page-header__row" style={{ flex: 1 }}>
        <div>
          <Title level={4} className="page-header__title">{title}</Title>
          {subtitle && (
            <Typography.Text type="secondary" className="page-header__subtitle">{subtitle}</Typography.Text>
          )}
        </div>
      </div>
      {extra && <div style={{ marginLeft: 16 }}>{extra}</div>}
    </div>
  );
}

export default PageHeader;
