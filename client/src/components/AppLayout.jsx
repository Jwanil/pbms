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
import { useLogout } from '../api/authApi';

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
];

// Map each sidebar menu key to its permission module name
const ROUTE_MODULE_MAP = {
  '/dashboard': 'dashboard',
  '/products': 'products',
  '/companies': 'companies',
  '/mapping': 'mappings',
  '/contacts': 'contacts',
  '/masters/categories': 'categories',
  '/masters/grades': 'grades',
  '/masters/packaging': 'packaging',
  '/masters/departments': 'departments',
  '/users': 'users',
};

// Filter menu items based on user permissions
const filterMenuItems = (items, permissions) => {
  return items
    .map((item) => {
      // If item has children (submenu like "Masters"), filter its children first
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children, permissions);
        // If no children remain after filtering, hide the entire submenu
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      // Check permission for this item
      const moduleName = ROUTE_MODULE_MAP[item.key];
      if (!moduleName) return item; // No mapping = always show (safety fallback)

      // Only show if user has can_view for this module
      return permissions?.[moduleName]?.can_view ? item : null;
    })
    .filter(Boolean);
};

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const handleMenuClick = ({ key }) => navigate(key);

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: isLoggingOut ? 'Logging out...' : 'Logout',
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  const visibleMenuItems = filterMenuItems(menuItems, permissions);

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
          items={visibleMenuItems}
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
              <div style={{ lineHeight: 1.3 }}>
                <Text strong>{user?.name || 'User'}</Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1 }}>
                  {user?.role || ''}
                </Text>
              </div>
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
