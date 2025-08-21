import React, { useState, useEffect } from 'react';
import { Shield, Key, Fingerprint, Eye, EyeOff, AlertTriangle, Settings, Smartphone, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import deviceCapabilities from '../services/deviceCapabilities';
import webauthnService from '../services/webauthnService';
import CrossDeviceAuth from './CrossDeviceAuth';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState('passkey');
  const [useMultiModal, setUseMultiModal] = useState(false);
  const [showCrossDeviceAuth, setShowCrossDeviceAuth] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [webauthnError, setWebauthnError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);

  // Check WebAuthn support on component mount
  useEffect(() => {
    checkWebAuthnSupport();
    // Attempt usernameless (local passkey) login prompt on load
    (async () => {
      try {
        if (!isLogin) return; // only on login screen
        const begin = await axios.post('/api/auth/login/begin', {});
        const assertion = await startAuthentication(begin.data);
        const complete = await axios.post('/api/auth/login/complete', {
          credential: assertion,
          expectedChallenge: begin.data.challenge,
        });
        if (complete.data.success) {
          localStorage.setItem('token', complete.data.token);
          localStorage.setItem('user', JSON.stringify(complete.data.user));
          onLogin(complete.data.user);
          toast.success('Logged in with a local passkey');
        }
      } catch (err) {
        // Silent fail: show normal form; if no local passkey, user can enter email to trigger QR/phone flow
      }
    })();
  }, []);

  const checkWebAuthnSupport = async () => {
    try {
      if (!window.PublicKeyCredential) {
        setWebauthnSupported(false);
        setWebauthnError('WebAuthn is not supported in this browser');
        return;
      }

      // Detect device capabilities
      const caps = await deviceCapabilities.detectCapabilities();
      setCapabilities(caps);
      setWebauthnSupported(caps.webauthnSupported);
      setWebauthnError(caps.webauthnSupported ? null : 'WebAuthn check failed');
      
      // Enable multi-modal if platform authenticator is available
      if (caps.platformAuthenticator) {
        setUseMultiModal(true);
      }
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
        // Check if this is a cross-device scenario
        if (formData.email && !capabilities?.platformAuthenticator) {
          // Show cross-device authentication options
          setShowCrossDeviceAuth(true);
          setLoading(false);
          return;
        }

        // Use multi-modal authentication if available
        if (useMultiModal && capabilities?.platformAuthenticator) {
          const result = await webauthnService.authenticate(formData.email || '');
          if (result.success) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            onLogin(result.data.user);
            if (result.usedFallback) {
              toast.success(`Logged in using fallback method: ${result.fallbackMethod}`);
            } else {
              toast.success('Logged in with passkey');
            }
          } else {
            throw new Error(result.error);
          }
        } else {
          // Fallback to original method
          const begin = await axios.post('/api/auth/login/begin', formData.email ? { username: formData.email } : {});

          // If allowCredentials is empty, suggest cross-device options
          if (Array.isArray(begin.data.allowCredentials) && begin.data.allowCredentials.length === 0 && formData.email) {
            toast('No local passkeys found. Use cross-device authentication.', { icon: 'ℹ️' });
            setShowCrossDeviceAuth(true);
            setLoading(false);
            return;
          }

          const assertion = await startAuthentication(begin.data);
          const complete = await axios.post('/api/auth/login/complete', {
            credential: assertion,
            expectedChallenge: begin.data.challenge,
          });

          if (complete.data.success) {
            localStorage.setItem('token', complete.data.token);
            localStorage.setItem('user', JSON.stringify(complete.data.user));
            onLogin(complete.data.user);
            toast.success('Logged in with passkey');
          } else {
            throw new Error(complete.data.error || 'Authentication failed');
          }
        }
      } else {
        // Registration
        if (useMultiModal && capabilities?.platformAuthenticator) {
          const result = await webauthnService.register(
            formData.email, 
            formData.username, 
            formData.username
          );
          if (result.success) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            onLogin(result.data.user);
            if (result.usedFallback) {
              toast.success(`Account created using fallback method: ${result.fallbackMethod}`);
            } else {
              toast.success('Account created successfully');
            }
          } else {
            throw new Error(result.error);
          }
        } else {
          // Fallback to original method
          const begin = await axios.post('/api/auth/register/begin', {
            username: formData.email,
            displayName: formData.username,
          });

          const credential = await startRegistration(begin.data);
          const complete = await axios.post('/api/auth/register/complete', {
          credential,
            expectedChallenge: begin.data.challenge,
          });

          if (complete.data.success) {
            localStorage.setItem('token', complete.data.token);
            localStorage.setItem('user', JSON.stringify(complete.data.user));
            onLogin(complete.data.user);
            toast.success('Account created successfully');
          } else {
            throw new Error(complete.data.error || 'Registration failed');
          }
        }
      }
    } catch (error) {
      console.error('Passkey auth error:', error);
      toast.error(error.message || 'Authentication failed');
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

  const handleAuthTypeChange = (type) => {
    setAuthType(type);
  };

  const toggleMultiModal = () => {
    setUseMultiModal(!useMultiModal);
  };

  const handleCrossDeviceBack = () => {
    setShowCrossDeviceAuth(false);
  };

  const handleCrossDeviceSuccess = (userData) => {
    onLogin(userData);
    setShowCrossDeviceAuth(false);
  };

  // Show cross-device authentication if needed
  if (showCrossDeviceAuth) {
    return (
      <div className="container">
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <CrossDeviceAuth
            email={formData.email}
            onBack={handleCrossDeviceBack}
            onSuccess={handleCrossDeviceSuccess}
          />
        </div>
      </div>
    );
  }

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

          {/* Multi-Modal Toggle */}
          {webauthnSupported && capabilities?.platformAuthenticator && (
            <div className="card" style={{ background: '#2a2a2a', marginBottom: '16px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={16} color="#007bff" />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Enhanced Authentication</span>
                </div>
                <button
                  type="button"
                  onClick={toggleMultiModal}
                  className={`btn ${useMultiModal ? 'btn-success' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  {useMultiModal ? 'ON' : 'OFF'}
                </button>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {useMultiModal ? 
                  'Choose between device auth (Face ID, Fingerprint) or security key' :
                  'Use basic passkey authentication'
                }
              </p>
            </div>
          )}

          {/* Cross-Device Authentication Info */}
          {isLogin && webauthnSupported && (
            <div className="card" style={{ background: '#1a2a2a', marginBottom: '16px', border: '1px solid #28a745' }}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={16} color="#28a745" />
                <span style={{ fontWeight: '500', color: '#28a745' }}>Sign in on Any Device</span>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>
                Don't have your passkey on this device? Enter your email to use your phone, QR code, or security key.
              </p>
            </div>
          )}

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

          {/* Auth Type (Passkey default) */}
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
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
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
                {useMultiModal && (
                  <li>Choose your preferred authentication method</li>
                )}
                <li>Sign in on any device with your phone or security key</li>
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
                <li>Use a modern browser (Chrome recommended)</li>
                <li>Ensure you're on HTTPS or localhost</li>
                <li>If no platform authenticator, try your phone or a security key</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
