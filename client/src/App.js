import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, BarChart3, CreditCard, Home, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import TransactionPage from './components/TransactionPage';
import AnalyticsPage from './components/AnalyticsPage';
import WebAuthnTest from './components/WebAuthnTest';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Helper function to check if a tab is active
  const isActiveTab = (path) => {
    if (path === '/dashboard' || path === '/') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  // Helper function to get tab button styles
  const getTabStyles = (path) => {
    const isActive = isActiveTab(path);
    return {
      ...(isActive ? {
        background: '#007bff',
        color: '#fff',
        borderColor: '#007bff'
      } : {
        background: 'transparent',
        color: '#ccc',
        borderColor: '#444'
      }),
      transition: 'all 0.2s ease-in-out',
      border: '1px solid',
      padding: '8px 16px',
      borderRadius: '6px',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '400',
      cursor: 'pointer'
    };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div>
      {/* Navigation */}
      <nav style={{
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        padding: '16px 0'
      }}>
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2" style={{ textDecoration: 'none', color: '#fff' }}>
                <Shield size={24} />
                <span style={{ fontSize: '20px', fontWeight: '600' }}>Modern Auth</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-muted">Welcome, {user.username}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Navigation */}
      <div style={{ background: '#0f0f0f', borderBottom: '1px solid #333' }}>
        <div className="container">
          <div className="flex gap-4" style={{ padding: '16px 0' }}>
            <Link to="/dashboard" style={getTabStyles('/dashboard')}>
              <Home size={16} />
              Dashboard
            </Link>
            <Link to="/transactions" style={getTabStyles('/transactions')}>
              <CreditCard size={16} />
              Transactions
            </Link>
            <Link to="/analytics" style={getTabStyles('/analytics')}>
              <BarChart3 size={16} />
              Analytics
            </Link>
            <Link to="/test" style={getTabStyles('/test')}>
              <Shield size={16} />
              WebAuthn Test
            </Link>
          </div>
        </div>
      </div>

      {/* Routes */}
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/transactions" element={<TransactionPage user={user} />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/test" element={<WebAuthnTest />} />
          <Route path="/" element={<Dashboard user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
