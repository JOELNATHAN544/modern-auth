import React, { useState } from 'react';
import { Smartphone, Key, QrCode, Mail, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CrossDeviceAuth = ({ email, onBack, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('method-selection'); // method-selection, qr-code, phone-auth

  const handleMethodSelection = (method) => {
    setSelectedMethod(method);
    
    if (method === 'qr-code') {
      setStep('qr-code');
    } else if (method === 'phone') {
      setStep('phone-auth');
    } else if (method === 'security-key') {
      handleSecurityKeyAuth();
    }
  };

  const handleSecurityKeyAuth = async () => {
    setIsLoading(true);
    try {
      // This would trigger security key authentication
      toast.success('Security key authentication initiated');
      // In a real implementation, you'd call the WebAuthn service here
    } catch (error) {
      toast.error('Security key authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    setIsLoading(true);
    try {
      // Simulate phone authentication
      toast.success('Phone authentication initiated');
      // In a real implementation, you'd send a push notification or SMS
    } catch (error) {
      toast.error('Phone authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeAuth = async () => {
    setIsLoading(true);
    try {
      // Simulate QR code authentication
      toast.success('QR code authentication initiated');
      // In a real implementation, you'd generate a QR code for the user to scan
    } catch (error) {
      toast.error('QR code authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Sign in to {email}
        </h2>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Choose how you'd like to authenticate on this device
        </p>
      </div>

      {/* Authentication Methods */}
      <div className="grid gap-3">
        {/* Phone Authentication */}
        <button
          onClick={() => handleMethodSelection('phone')}
          className="btn btn-secondary"
          style={{ 
            justifyContent: 'flex-start', 
            padding: '16px',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-3">
            <Smartphone size={20} color="#007bff" />
            <div>
              <div style={{ fontWeight: '500' }}>Use Your Phone</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Get a push notification or SMS on your phone
              </div>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
          </div>
        </button>

        {/* QR Code Authentication */}
        <button
          onClick={() => handleMethodSelection('qr-code')}
          className="btn btn-secondary"
          style={{ 
            justifyContent: 'flex-start', 
            padding: '16px',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-3">
            <QrCode size={20} color="#28a745" />
            <div>
              <div style={{ fontWeight: '500' }}>Scan QR Code</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Scan with your phone's camera or authenticator app
              </div>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
          </div>
        </button>

        {/* Security Key */}
        <button
          onClick={() => handleMethodSelection('security-key')}
          className="btn btn-secondary"
          style={{ 
            justifyContent: 'flex-start', 
            padding: '16px',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-3">
            <Key size={20} color="#ffc107" />
            <div>
              <div style={{ fontWeight: '500' }}>Use Security Key</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Insert your USB security key or NFC device
              </div>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
          </div>
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: '16px' }}
      >
        ← Back to Login
      </button>
    </div>
  );

  const renderQRCode = () => (
    <div className="text-center space-y-4">
      <div className="mb-6">
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Scan QR Code
        </h2>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Open your phone's camera or authenticator app to scan
        </p>
      </div>

      {/* QR Code Placeholder */}
      <div 
        style={{
          width: '200px',
          height: '200px',
          background: '#2a2a2a',
          border: '2px dashed #444',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          color: '#888'
        }}
      >
        <div className="text-center">
          <QrCode size={48} />
          <p style={{ fontSize: '12px', marginTop: '8px' }}>QR Code</p>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>1. Open your phone's camera or authenticator app</p>
        <p>2. Point it at the QR code above</p>
        <p>3. Follow the prompts on your phone</p>
      </div>

      <button
        onClick={() => setStep('method-selection')}
        className="btn btn-secondary"
        style={{ width: '100%' }}
      >
        ← Back to Methods
      </button>
    </div>
  );

  const renderPhoneAuth = () => (
    <div className="text-center space-y-4">
      <div className="mb-6">
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Phone Authentication
        </h2>
        <p style={{ color: '#888', fontSize: '14px' }}>
          We'll send a verification code to your phone
        </p>
      </div>

      {/* Phone Number Input */}
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
          type="tel"
          className="form-input"
          placeholder="+1 (555) 123-4567"
          style={{ textAlign: 'center' }}
        />
      </div>

      <button
        onClick={handlePhoneAuth}
        disabled={isLoading}
        className="btn btn-success"
        style={{ width: '100%' }}
      >
        {isLoading ? (
          <>
            <div className="loading"></div>
            Sending Code...
          </>
        ) : (
          <>
            <Mail size={16} />
            Send Verification Code
          </>
        )}
      </button>

      <button
        onClick={() => setStep('method-selection')}
        className="btn btn-secondary"
        style={{ width: '100%' }}
      >
        ← Back to Methods
      </button>
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
      {step === 'method-selection' && renderMethodSelection()}
      {step === 'qr-code' && renderQRCode()}
      {step === 'phone-auth' && renderPhoneAuth()}
    </div>
  );
};

export default CrossDeviceAuth;
