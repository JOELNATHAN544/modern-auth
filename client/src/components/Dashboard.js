import React from 'react';
import { User, Shield, Clock, Mail } from 'lucide-react';

const Dashboard = ({ user }) => {
  return (
    <div>
      <div className="card">
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          Welcome back, {user.username}! 👋
        </h1>
        <p className="text-muted">
          You're securely authenticated using modern WebAuthn technology.
        </p>
      </div>

      <div className="grid grid-2">
        {/* User Profile Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#007bff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Profile Information</h3>
              <p className="text-muted">Your account details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={16} color="#007bff" />
              <span><strong>Username:</strong> {user.username}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} color="#007bff" />
              <span><strong>Email:</strong> {user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={16} color="#28a745" />
              <span><strong>Authentication:</strong> WebAuthn Passkey</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} color="#ffc107" />
              <span><strong>Member since:</strong> {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Security Status Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} color="#28a745" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Security Status</h3>
              <p className="text-muted">Your account security</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Passkey Authentication</span>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Phishing Protection</span>
              <span className="badge badge-success">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Multi-Factor Auth</span>
              <span className="badge badge-success">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Account Status</span>
              <span className="badge badge-success">Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Quick Actions
        </h3>
        
        <div className="grid grid-3">
          <div className="card" style={{ background: '#2a2a2a', cursor: 'pointer' }}>
            <div className="text-center">
              <Shield size={32} color="#007bff" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                View Analytics
              </h4>
              <p style={{ fontSize: '14px', color: '#888' }}>
                Check conversion rates and authentication metrics
              </p>
            </div>
          </div>

          <div className="card" style={{ background: '#2a2a2a', cursor: 'pointer' }}>
            <div className="text-center">
              <User size={32} color="#28a745" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                Test Transactions
              </h4>
              <p style={{ fontSize: '14px', color: '#888' }}>
                Try step-up authentication for high-value transactions
              </p>
            </div>
          </div>

          <div className="card" style={{ background: '#2a2a2a', cursor: 'pointer' }}>
            <div className="text-center">
              <Clock size={32} color="#ffc107" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                Session Info
              </h4>
              <p style={{ fontSize: '14px', color: '#888' }}>
                View your current session and security details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="card">
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Modern Authentication Features
        </h3>
        
        <div className="grid grid-2">
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#28a745' }}>
              ✅ WebAuthn / Passkeys
            </h4>
            <ul style={{ fontSize: '14px', color: '#ccc', paddingLeft: '20px' }}>
              <li>Phishing-resistant authentication</li>
              <li>No passwords to remember or manage</li>
              <li>Works across all your devices</li>
              <li>Biometric authentication support</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#007bff' }}>
              🔒 Step-up Authentication
            </h4>
            <ul style={{ fontSize: '14px', color: '#ccc', paddingLeft: '20px' }}>
              <li>Automatic for transactions over €150</li>
              <li>PSD3 compliance for banking</li>
              <li>Additional security layer when needed</li>
              <li>OTP-based verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
