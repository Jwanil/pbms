import { useState } from 'react';
import './styles/AppLayout.css';
import { Layout, Menu, Typography, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, UserOutlined, DownOutlined,
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/useLayoutStore';
import { useLogout } from '../api/authApi';
import { routes } from '../router';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

/**
 * Builds the Ant Design Menu `items` array from the route config.
 *
 * Logic:
 *  1. Walk the authenticated shell's children (routes[1].children).
 *  2. Skip routes with showInNav = false.
 *  3. Apply role filtering (adminOnly / userOnly).
 *  4. Apply permission filtering (route.module → permissions[module].can_view).
 *  5. Group routes with the same `group` key under a single submenu.
 */
function buildMenuItems(routeChildren, permissions, userRole) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  // Collect visible leaf routes
  const visibleRoutes = routeChildren.filter((r) => {
    if (!r.showInNav) return false;
    if (r.adminOnly && !isSuperAdmin) return false;
    if (r.userOnly && isSuperAdmin) return false;
    if (r.module && !permissions?.[r.module]?.can_view) return false;
    return true;
  });

  const items = [];
  const groupsSeen = new Set();

  for (const r of visibleRoutes) {
    if (r.group) {
      // Already added this group's header — just add the child
      if (!groupsSeen.has(r.group)) {
        groupsSeen.add(r.group);
        // Collect all visible children for this group
        const groupChildren = visibleRoutes
          .filter((x) => x.group === r.group)
          .map((x) => ({ key: `/${x.path}`, label: x.label }));

        items.push({
          key: r.group,
          icon: r.groupIcon,
          label: r.groupLabel,
          children: groupChildren,
        });
      }
      // Child already added as part of the group — skip individual push
    } else {
      // Top-level menu item
      items.push({
        key: `/${r.path}`,
        icon: r.icon,
        label: r.label,
      });
    }
  }

  return items;
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pageTitle, pageBreadcrumbs } = useLayoutStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // The authenticated shell is always routes[1]; its children hold page routes
  const authChildren = routes[1]?.children ?? [];
  const menuItems = buildMenuItems(authChildren, permissions, user?.role);

  const handleMenuClick = ({ key }) => navigate(key);
  const handleLogout = () => logout();

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
          defaultOpenKeys={['masters', 'enquiries']}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-sidebar-menu"
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              className="app-header__collapse-btn"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>

            {pageTitle && (
              <div className="app-header__page-title">
                <Typography.Title level={5} style={{ margin: 0, color: '#1F3A6E', fontWeight: 600 }}>
                  {pageBreadcrumbs.length > 0 ? pageBreadcrumbs.join(' / ') : pageTitle}
                </Typography.Title>
              </div>
            )}
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