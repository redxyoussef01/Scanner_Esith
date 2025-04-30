import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SecondPage from './pages/SecondPage';
import HistoryPage from './pages/HistoryPage';
import ProductInventoryPage from './pages/ProductInventoryPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';
import StockValidationPage from './pages/StockValidationPage';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    // Check for stored user on initial app load
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setIsAuthenticated(true);
      setLoggedInUser(storedUser);
    } else {
      setIsAuthenticated(false);
      setLoggedInUser(null);
      // If not authenticated on initial load and not on /login, redirect to login
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
    }

    // Listen for changes in localStorage (e.g., after login)
    const handleStorageChange = () => {
      const currentUser = localStorage.getItem('currentUser');
      setIsAuthenticated(!!currentUser);
      setLoggedInUser(currentUser);
      // If logged in, navigate away from login page
      if (currentUser && window.location.pathname === '/login') {
        navigate('/');
      } else if (!currentUser && window.location.pathname !== '/login') {
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Public route for login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout
              collapsed={collapsed}
              toggleSidebar={toggleSidebar}
              loggedInUser={loggedInUser}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/transactions" element={<SecondPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/inventory" element={<ProductInventoryPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/stock-validation" element={< StockValidationPage/>} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;