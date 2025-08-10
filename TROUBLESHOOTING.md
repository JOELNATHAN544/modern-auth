# WebAuthn Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue: "Your device can't be used with this site"

This error occurs when WebAuthn is not properly supported or configured. Here are the solutions:

#### **Solution 1: Use Demo Mode**
1. When you see the error, click "OK" to close the modal
2. Look for the "🎮 Try Demo Mode" button in the troubleshooting section
3. Click it to simulate passkey authentication for testing

#### **Solution 2: Check Browser Compatibility**
- **Chrome**: Version 67+ (recommended)
- **Firefox**: Version 60+
- **Safari**: Version 13+
- **Edge**: Version 18+

#### **Solution 3: Verify Device Support**
- **Desktop**: Requires biometric authentication (fingerprint, face ID, etc.)
- **Mobile**: Usually works better than desktop
- **Virtual Machines**: May not support WebAuthn

#### **Solution 4: Check Security Context**
- ✅ **localhost** (works for development)
- ✅ **HTTPS** (required for production)
- ❌ **HTTP** (doesn't work)

### Issue: "Authentication was cancelled by the user"

This happens when:
1. User cancels the biometric prompt
2. Device doesn't support the requested authentication method
3. Browser blocks the authentication

**Solutions:**
- Try again and complete the biometric authentication
- Use demo mode for testing
- Check if your device has biometric authentication enabled

### Issue: "NotSupportedError"

This means your device doesn't support the required WebAuthn features.

**Solutions:**
- Use a different device (mobile often works better)
- Try demo mode
- Use password authentication (if implemented)

## 🔧 Testing Steps

### Step 1: Run WebAuthn Test
1. Navigate to http://localhost:3000
2. Click "WebAuthn Test" in the navigation
3. Review the test results
4. Follow the recommendations

### Step 2: Try Demo Mode
1. Go to the authentication page
2. If WebAuthn fails, click "🎮 Try Demo Mode"
3. This will simulate successful authentication

### Step 3: Test All Features
1. **Authentication**: Use demo mode to login
2. **Transactions**: Test step-up authentication
3. **Analytics**: View conversion metrics

## 🌐 Browser-Specific Issues

### Chrome
- **Issue**: "Your device can't be used with this site"
- **Solution**: 
  - Go to `chrome://flags/`
  - Enable "Web Authentication API"
  - Restart Chrome

### Firefox
- **Issue**: WebAuthn not working
- **Solution**:
  - Go to `about:config`
  - Set `security.webauth.webauthn` to `true`
  - Restart Firefox

### Safari
- **Issue**: Limited WebAuthn support
- **Solution**: Use Chrome or Firefox for better compatibility

## 📱 Device-Specific Issues

### Desktop/Laptop
- **Requirement**: Built-in biometric authentication
- **Common Issues**: 
  - No fingerprint reader
  - No face recognition camera
  - Virtual machine environment

### Mobile Devices
- **Usually works better** than desktop
- **Requirement**: Biometric authentication enabled
- **Common Issues**: 
  - Biometric authentication disabled
  - Outdated OS

## 🛠️ Development Environment

### Localhost Setup
```bash
# Start the application
npm run dev

# Access the app
http://localhost:3000
```

### HTTPS Setup (for production testing)
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start with HTTPS
HTTPS=true SSL_CRT_FILE=cert.pem SSL_KEY_FILE=key.pem npm start
```

## 🎯 Quick Fixes

### Immediate Solutions
1. **Use Demo Mode**: Click "🎮 Try Demo Mode" button
2. **Switch Browser**: Try Chrome or Firefox
3. **Use Mobile**: Test on a mobile device
4. **Enable Biometrics**: Ensure device biometrics are enabled

### For Testing Purposes
- Demo mode simulates all WebAuthn functionality
- All features work normally in demo mode
- Analytics and transactions work as expected

## 📞 Support

If you're still having issues:

1. **Check the WebAuthn Test page** for detailed diagnostics
2. **Use Demo Mode** for immediate testing
3. **Try a different browser** or device
4. **Review browser console** for error messages

## 🔍 Debug Information

### Check Browser Console
```javascript
// Test WebAuthn support
console.log('WebAuthn supported:', !!window.PublicKeyCredential);

// Test platform authenticator
if (window.PublicKeyCredential) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => console.log('Platform authenticator:', available));
}

// Check secure context
console.log('Secure context:', window.isSecureContext);
```

### Common Error Messages
- `NotSupportedError`: Device doesn't support WebAuthn
- `NotAllowedError`: User cancelled authentication
- `SecurityError`: Not in secure context
- `InvalidStateError`: Credential already exists

---

**Remember**: Demo mode is available for testing all features even when WebAuthn is not supported!
