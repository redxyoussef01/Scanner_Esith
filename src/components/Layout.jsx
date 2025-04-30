import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Dropdown } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    HomeOutlined,
    SwapOutlined,
    UserOutlined,
    LogoutOutlined,
    DatabaseOutlined,
    BarChartOutlined,
    HistoryOutlined,
    CheckCircleOutlined, // Import the check circle icon
} from '@ant-design/icons';

const cocaColaRed = '#E30613';

function Layout({ children, collapsed, toggleSidebar, loggedInUser }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const profileItems = [
        {
            key: 'logout',
            label: 'Se déconnecter',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        setIsAdmin(userRole === 'admin' || userRole === 'super admin');
    }, []);

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
                    zIndex: 100,
                    overflowY: 'auto',
                    width: collapsed ? '80px' : '200px',
                    transition: 'width 0.3s',
                    backgroundColor: cocaColaRed, // Apply red here
                    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                }}
            >
                <div className="sidebar-content">
                    <div className="sidebar-header">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={toggleSidebar}
                            className="sidebar-toggle"
                            style={{ margin: '16px', width: collapsed ? '48px' : 'auto', color: '#fff' }} //white color for the button
                        />
                    </div>
                    <div className="sidebar-menu" style={{ marginTop: '20px' }}>
                        <Link to="/" className={`menu-item ${location.pathname === '/' ? 'active' : ''}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 24px',
                            color: location.pathname === '/' ? '#fff' : 'rgba(255,255,255,0.7)', // White text
                            backgroundColor: location.pathname === '/' ? '#b30007' : 'transparent', // slightly darker red for active
                            borderRight: location.pathname === '/' ? '3px solid #fff' : 'none',
                            textDecoration: 'none',
                        }}>
                            <HomeOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                            {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Accueil</span>}
                        </Link>
                        <Link to="/transactions" className={`menu-item ${location.pathname === '/transactions' ? 'active' : ''}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 24px',
                            color: location.pathname === '/transactions' ? '#fff' : 'rgba(255,255,255,0.7)',
                            backgroundColor: location.pathname === '/transactions' ? '#b30007' : 'transparent',
                            borderRight: location.pathname === '/transactions' ? '3px solid #fff' : 'none',
                            textDecoration: 'none',
                        }}>
                            <SwapOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                            {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Transactions</span>}
                        </Link>
                        <Link to="/stock-validation" className={`menu-item ${location.pathname === '/stock-validation' ? 'active' : ''}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 24px',
                            color: location.pathname === '/stock-validation' ? '#fff' : 'rgba(255,255,255,0.7)',
                            backgroundColor: location.pathname === '/stock-validation' ? '#b30007' : 'transparent',
                            borderRight: location.pathname === '/stock-validation' ? '3px solid #fff' : 'none',
                            textDecoration: 'none',
                        }}>
                            <CheckCircleOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                            {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Valider Stock</span>}
                        </Link>
                        {(isAdmin) && (
                            <Link to="/history" className={`menu-item ${location.pathname === '/history' ? 'active' : ''}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 24px',
                                color: location.pathname === '/history' ? '#fff' : 'rgba(255,255,255,0.7)',
                                backgroundColor: location.pathname === '/history' ? '#b30007' : 'transparent',
                                borderRight: location.pathname === '/history' ? '3px solid #fff' : 'none',
                                textDecoration: 'none',
                            }}>
                                <HistoryOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                                {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Historique</span>}
                            </Link>
                        )}
                        {(isAdmin) && (
                            <Link to="/inventory" className={`menu-item ${location.pathname === '/inventory' ? 'active' : ''}`} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 24px',
                                color: location.pathname === '/inventory' ? '#fff' : 'rgba(255,255,255,0.7)',
                                backgroundColor: location.pathname === '/inventory' ? '#b30007' : 'transparent',
                                borderRight: location.pathname === '/inventory' ? '3px solid #fff' : 'none',
                                textDecoration: 'none',
                            }}>
                                <DatabaseOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                                {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Inventaire</span>}
                            </Link>
                        )}
                        <Link to="/statistics" className={`menu-item ${location.pathname === '/statistics' ? 'active' : ''}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 24px',
                            color: location.pathname === '/statistics' ? '#fff' : 'rgba(255,255,255,0.7)',
                            backgroundColor: location.pathname === '/statistics' ? '#b30007' : 'transparent',
                            borderRight: location.pathname === '/statistics' ? '3px solid #fff' : 'none',
                            textDecoration: 'none',
                        }}>
                            <BarChartOutlined className="menu-icon" style={{ fontSize: '18px', color: '#fff' }} />
                            {!collapsed && <span className="menu-text" style={{ marginLeft: '12px', color: '#fff' }}>Statistiques</span>}
                        </Link>
                    </div>
                </div>

                {/* Red profile button at the bottom of sidebar */}
                <div className="sidebar-footer" style={{
                    position: 'absolute',
                    bottom: '20px',
                    width: '100%',
                    padding: collapsed ? '0 16px' : '0 24px',
                }}>
                    <Dropdown menu={{ items: profileItems }} placement="topRight">
                        <Button
                            type="primary"
                            danger
                            className="profile-button"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                padding: collapsed ? '8px' : '8px 16px',
                                backgroundColor: '#fff', // White for button
                                color: cocaColaRed,     // Red text
                                border: `1px solid ${cocaColaRed}`
                            }}
                        >
                            <UserOutlined className="profile-icon" style={{ color: cocaColaRed }} />
                            {!collapsed && <span className="profile-text" style={{ marginLeft: '8px', color: cocaColaRed }}>Profil</span>}
                        </Button>
                    </Dropdown>
                </div>
            </div>

            {/* Main Content */}
            <div
                className="main-content"
                style={{
                    marginLeft: collapsed ? '80px' : '200px',
                    width: 'calc(100% - ' + (collapsed ? '80px' : '200px') + ')',
                    padding: '20px',
                    transition: 'margin-left 0.3s, width 0.3s',
                }}
            >
                <div className="content-container" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px' }}>{children}</div>
            </div>
        </div>
    );
}

export default Layout;