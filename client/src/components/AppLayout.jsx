import { useState } from 'react';
import './styles/AppLayout.css';
import { Layout, Menu, Typography, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, AppstoreOutlined, BankOutlined,
  SwapOutlined, ContactsOutlined, TagsOutlined,
  UserOutlined, SafetyOutlined, DownOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,
  QuestionCircleOutlined,
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
      { key: '/masters/locations', label: 'Locations' },
    ],
  },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  {
    key: 'enquiries',
    icon: <QuestionCircleOutlined />,
    label: 'Enquiries',
    children: [
      { key: '/enquiries/new', label: 'New Enquiry' },
      { key: '/enquiries/mine', label: 'My Queries' },
      { key: '/enquiries/admin', label: 'All Enquiries' },
    ],
  },
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
  '/masters/locations': 'locations_countries',
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
      key: '/profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: isLoggingOut ? 'Logging out...' : 'Logout',
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  const visibleMenuItems = filterMenuItems(menuItems, permissions).map(item => {
    if (item.key === 'enquiries') {
      const children = item.children.filter(child => {
        if (child.key === '/enquiries/admin' && user?.role !== 'SUPER_ADMIN') return false;
        if (child.key === '/enquiries/new' && user?.role === 'SUPER_ADMIN') return false;
        if (child.key === '/enquiries/mine' && user?.role === 'SUPER_ADMIN') return false;
        return true;
      });
      return { ...item, children }; 
    }

    return item;
  });

  return (
    <Layout className="app-layout">
      <Sider collapsible collapsed={collapsed} trigger={null} width={240} theme="dark">
        <div className="app-sidebar-brand">
          <Text strong className="app-sidebar-brand__text">
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
          className="app-sidebar-menu"
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <div
            onClick={() => setCollapsed(!collapsed)}
            className="app-header__collapse-btn"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Space className="app-header__user">
              <Avatar className="app-header__avatar" icon={<UserOutlined />} />
              <div className="app-header__user-info">
                <Text strong>{user?.name || 'User'}</Text>
                <Text type="secondary" className="app-header__user-role">
                  {user?.role || ''}
                </Text>
              </div>
              <DownOutlined className="app-header__chevron" />
            </Space>
          </Dropdown>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;