import { Link, useLocation } from 'react-router-dom';
import { Button, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  SwapOutlined, // Icon for Transactions
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined, // Icon for Inventory
  BarChartOutlined, // Icon for Statistics
  HistoryOutlined, // Icon for History
} from '@ant-design/icons';

function Layout({ children, collapsed, toggleSidebar, onLogout }) {
  const location = useLocation();

  // Profile dropdown menu items
  const profileItems = [
    {
      key: 'logout',
      label: 'Se déconnecter',
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed Sidebar */}
      <div
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100, // Ensure it's above other content
          overflowY: 'auto', // Allow scrolling if content overflows
        }}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className="sidebar-toggle"
            />
          </div>
          <div className="sidebar-menu">
            <Link to="/" className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}>
              <HomeOutlined className="menu-icon" />
              {!collapsed && <span className="menu-text">Accueil</span>}
            </Link>
            <Link to="/transactions" className={`menu-item ${location.pathname === '/transactions' ? 'active' : ''}`}>
              <SwapOutlined className="menu-icon" /> {/* Icon for Transactions */}
              {!collapsed && <span className="menu-text">Transactions</span>}
            </Link>
            <Link to="/history" className={`menu-item ${location.pathname === '/history' ? 'active' : ''}`}>
              <HistoryOutlined className="menu-icon" /> {/* Added History button back */}
              {!collapsed && <span className="menu-text">Historique</span>} {/* Text for History button */}
            </Link>
            <Link to="/inventory" className={`menu-item ${location.pathname === '/inventory' ? 'active' : ''}`}>
              <DatabaseOutlined className="menu-icon" /> {/* Icon for Inventory */}
              {!collapsed && <span className="menu-text">Inventaire</span>}
            </Link>
            <Link to="/statistics" className={`menu-item ${location.pathname === '/statistics' ? 'active' : ''}`}>
              <BarChartOutlined className="menu-icon" /> {/* Statistics button */}
              {!collapsed && <span className="menu-text">Statistiques</span>} {/* Text for Statistics button */}
            </Link>
          </div>
        </div>

        {/* Red profile button at the bottom of sidebar */}
        <div className="sidebar-footer">
          <Dropdown menu={{ items: profileItems }} placement="topRight">
            <Button type="primary" danger className="profile-button">
              <UserOutlined className="profile-icon" />
              {!collapsed && <span className="profile-text">Profil</span>}
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="main-content"
        style={{
          marginLeft: collapsed ? '80px' : '200px', // Adjust margin based on collapsed state
          width: '100%',
        }}
      >
        <div className="content-container">{children}</div>
      </div>
    </div>
  );
}

export default Layout;