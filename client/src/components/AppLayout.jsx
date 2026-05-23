import { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, AppstoreOutlined, BankOutlined,
  SwapOutlined, ContactsOutlined, TagsOutlined,
  UserOutlined, SafetyOutlined, DownOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
  { key: '/companies', icon: <BankOutlined />, label: 'Companies' },
  { key: '/mapping', icon: <SwapOutlined />, label: 'Product Mapping' },
  { key: '/contacts', icon: <ContactsOutlined />, label: 'Contacts' },
  {
    key: 'masters',
    icon: <TagsOutlined />,
    label: 'Masters',
    children: [
      { key: '/masters/categories', label: 'Categories' },
      { key: '/masters/grades', label: 'Grades' },
      { key: '/masters/packaging', label: 'Packaging' },
      { key: '/masters/departments', label: 'Departments' },
    ],
  },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/roles', icon: <SafetyOutlined />, label: 'Roles & Rights' },
];

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleMenuClick = ({ key }) => navigate(key);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} trigger={null} width={240} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Text strong style={{ color: '#fff', fontSize: collapsed ? 18 : 16, letterSpacing: 1 }}>
            {collapsed ? 'P' : 'PBMS'}
          </Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['masters']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18, color: '#1F3A6E' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1F3A6E' }} icon={<UserOutlined />} />
              <Text strong>{user?.name || 'User'}</Text>
              <DownOutlined style={{ fontSize: 11 }} />
            </Space>
          </Dropdown>
        </Header>

        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 112px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
