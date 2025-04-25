import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route, NOT BrowserRouter
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SecondPage from './pages/SecondPage';
import HistoryPage from './pages/HistoryPage';
import ProductInventoryPage from './pages/ProductInventoryPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null); // You'll need to manage login state

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogin = (user) => {
    setLoggedInUser(user);
    // You might want to store this in local storage or a state management tool
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    // Clear any stored login information
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/*"
        element={
          loggedInUser ? ( // Conditionally render Layout if logged in
            <Layout collapsed={collapsed} toggleSidebar={toggleSidebar} onLogout={handleLogout} loggedInUser={loggedInUser}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/transactions" element={<SecondPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/inventory" element={<ProductInventoryPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
              </Routes>
            </Layout>
          ) : (
            <LoginPage onLogin={handleLogin} /> // Redirect to login if not logged in (optional here, handled by Layout too)
          )
        }
      />
    </Routes>
  );
}

export default App;