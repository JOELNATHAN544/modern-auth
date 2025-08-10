import React, { useState, useEffect } from 'react';
import { Shield, Key, Fingerprint, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [webauthnError, setWebauthnError] = useState(null);

  // Check WebAuthn support on component mount
  useEffect(() => {
    checkWebAuthnSupport();
  }, []);

  const checkWebAuthnSupport = () => {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setWebauthnSupported(false);
        setWebauthnError('WebAuthn is not supported in this browser');
        return;
      }

      // Check if the browser supports the required features
      if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        setWebauthnSupported(false);
        setWebauthnError('Platform authenticator not available');
        return;
      }

      // Check if user verification is available
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (available) {
            setWebauthnSupported(true);
            setWebauthnError(null);
          } else {
            setWebauthnSupported(false);
            setWebauthnError('Platform authenticator not available on this device');
          }
        })
        .catch(() => {
          setWebauthnSupported(false);
          setWebauthnError('Unable to check platform authenticator availability');
        });
    } catch (error) {
      setWebauthnSupported(false);
      setWebauthnError('WebAuthn check failed');
    }
  };

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
      } else if (error.name === 'NotSupportedError') {
        toast.error('Your device does not support passkeys. Switching to demo mode for testing.');
        handleDemoAuth();
      } else if (error.name === 'SecurityError') {
        toast.error('Security error. Please ensure you are using HTTPS or localhost.');
      } else {
        // If WebAuthn fails, offer demo mode
        // eslint-disable-next-line no-restricted-globals
        if (confirm('WebAuthn authentication failed. Would you like to try demo mode for testing?')) {
          handleDemoAuth();
        } else {
          toast.error(error.response?.data?.error || 'Authentication failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAuth = async () => {
    try {
      // Simulate successful authentication for demo purposes
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        username: formData.username || 'Demo User',
        email: formData.email
      };

      const demoToken = 'demo-token-' + Date.now();
      
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(demoUser));
      onLogin(demoUser);
      toast.success('Demo authentication successful! (WebAuthn simulation)');
    } catch (error) {
      toast.error('Demo authentication failed');
    }
  };

  const handleSubmit = (e) => {
    if (authType === 'passkey') {
      handlePasskeyAuth(e);
    } else {
      handlePasswordAuth(e);
    }
  };

  const handleAuthTypeChange = (type) => {
    if (type === 'passkey' && !webauthnSupported) {
      toast('Passkey support not detected. You can still try, or use demo mode if it fails.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    }
    setAuthType(type);
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

          {/* WebAuthn Compatibility Warning */}
          {!webauthnSupported && (
            <div className="card" style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7',
              marginBottom: '16px'
            }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} color="#856404" />
                <span style={{ fontWeight: '600', color: '#856404' }}>Passkey Support</span>
              </div>
              <p style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>
                {webauthnError || 'Passkeys are not supported on this device'}
              </p>
              <button
                onClick={checkWebAuthnSupport}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Retry Check
              </button>
            </div>
          )}

          {/* Auth Type Toggle */}
          <div className="flex gap-2 mb-4" style={{ background: '#2a2a2a', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => handleAuthTypeChange('password')}
              className={`btn ${authType === 'password' ? 'btn-success' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '14px' }}
            >
              <Key size={16} />
              Password
            </button>
            <button
              type="button"
              onClick={() => handleAuthTypeChange('passkey')}
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
              {isLogin ? "Don&apos;t have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {authType === 'passkey' && webauthnSupported && (
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

          {/* Troubleshooting Tips */}
          {authType === 'passkey' && !webauthnSupported && (
            <div className="card" style={{ marginTop: '16px', background: '#2a2a2a' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} color="#ffc107" />
                <span style={{ fontWeight: '500', color: '#ffc107' }}>Troubleshooting</span>
              </div>
              <ul style={{ fontSize: '14px', color: '#ccc', paddingLeft: '20px' }}>
                <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Ensure you're on HTTPS or localhost</li>
                <li>Check if your device supports biometric authentication</li>
                <li>Try using password authentication as fallback</li>
              </ul>
              
              {/* Demo Mode Button */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #444' }}>
                <button
                  onClick={handleDemoAuth}
                  className="btn btn-success"
                  style={{ width: '100%', fontSize: '14px' }}
                >
                  🎮 Try Demo Mode
                </button>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                  Simulate passkey authentication for testing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
