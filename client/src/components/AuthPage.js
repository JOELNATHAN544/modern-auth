import React, { useState } from 'react';
import { Shield, Key, Fingerprint, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState('password'); // 'password' or 'passkey'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // For demo purposes, we'll simulate password login
        // In a real app, you'd have a password authentication endpoint
        toast.error('Password authentication not implemented in this demo. Please use passkeys.');
      } else {
        // Simulate password registration
        toast.error('Password registration not implemented in this demo. Please use passkeys.');
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login with passkey
        const response = await axios.post('/api/auth/login/options', {
          email: formData.email
        });

        const credential = await startAuthentication(response.data);
        
        const verificationResponse = await axios.post('/api/auth/login/verify', {
          credential,
          expectedChallenge: response.data.challenge
        });

        if (verificationResponse.data.success) {
          localStorage.setItem('token', verificationResponse.data.token);
          localStorage.setItem('user', JSON.stringify(verificationResponse.data.user));
          onLogin(verificationResponse.data.user);
          toast.success('Login successful!');
        }
      } else {
        // Register with passkey
        const response = await axios.post('/api/auth/register/options', {
          username: formData.username,
          email: formData.email
        });

        const credential = await startRegistration(response.data);
        
        const verificationResponse = await axios.post('/api/auth/register/verify', {
          credential,
          expectedChallenge: response.data.challenge
        });

        if (verificationResponse.data.success) {
          localStorage.setItem('token', verificationResponse.data.token);
          localStorage.setItem('user', JSON.stringify(verificationResponse.data.user));
          onLogin(verificationResponse.data.user);
          toast.success('Registration successful!');
        }
      }
    } catch (error) {
      console.error('Passkey auth error:', error);
      if (error.name === 'InvalidStateError') {
        toast.error('This passkey is already registered. Please try logging in.');
      } else if (error.name === 'NotAllowedError') {
        toast.error('Authentication was cancelled by the user.');
      } else {
        toast.error(error.response?.data?.error || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (authType === 'passkey') {
      handlePasskeyAuth(e);
    } else {
      handlePasswordAuth(e);
    }
  };

  return (
    <div className="container">
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="text-center mb-4">
            <Shield size={48} style={{ margin: '0 auto 16px', color: '#007bff' }} />
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted">
              {isLogin ? 'Sign in to your account' : 'Set up your secure account'}
            </p>
          </div>

          {/* Auth Type Toggle */}
          <div className="flex gap-2 mb-4" style={{ background: '#2a2a2a', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setAuthType('password')}
              className={`btn ${authType === 'password' ? 'btn-success' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '14px' }}
            >
              <Key size={16} />
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthType('passkey')}
              className={`btn ${authType === 'passkey' ? 'btn-success' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '14px' }}
            >
              <Fingerprint size={16} />
              Passkey
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your username"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            {authType === 'password' && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {authType === 'passkey' ? <Fingerprint size={16} /> : <Key size={16} />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {authType === 'passkey' && (
            <div className="card" style={{ marginTop: '16px', background: '#2a2a2a' }}>
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint size={16} color="#28a745" />
                <span style={{ fontWeight: '500' }}>Passkey Benefits</span>
              </div>
              <ul style={{ fontSize: '14px', color: '#ccc', paddingLeft: '20px' }}>
                <li>Phishing-resistant authentication</li>
                <li>No passwords to remember</li>
                <li>Works across all your devices</li>
                <li>Faster and more secure</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
