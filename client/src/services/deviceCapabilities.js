class DeviceCapabilitiesService {
  constructor() {
    this.capabilities = {
      webauthnSupported: false,
      platformAuthenticator: false,
      userVerification: false,
      secureContext: false,
      httpsOrLocalhost: false,
      availableMethods: []
    };
    this.authPreference = null;
  }

  async detectCapabilities() {
    try {
      // Test 1: WebAuthn Support
      this.capabilities.webauthnSupported = !!window.PublicKeyCredential;
      
      // Test 2: Platform Authenticator
      if (this.capabilities.webauthnSupported && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        this.capabilities.platformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      
      // Test 3: User Verification
      this.capabilities.userVerification = this.capabilities.platformAuthenticator;
      
      // Test 4: Secure Context
      this.capabilities.secureContext = window.isSecureContext;
      
      // Test 5: HTTPS or Localhost
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
      this.capabilities.httpsOrLocalhost = window.location.protocol === 'https:' || isLocalhost;
      
      // Determine available authentication methods
      this.capabilities.availableMethods = this.determineAvailableMethods();
      
      return this.capabilities;
    } catch (error) {
      console.error('Device capability detection failed:', error);
      return this.capabilities;
    }
  }

  determineAvailableMethods() {
    const methods = [];
    
    if (this.capabilities.platformAuthenticator) {
      // Platform authenticator available - can use device auth
      methods.push('device');
    }
    
    // PIN is always available as fallback
    methods.push('pin');
    
    // If we have both, allow user to choose
    if (methods.length > 1) {
      methods.push('both');
    }
    
    return methods;
  }

  setAuthPreference(preference) {
    if (this.capabilities.availableMethods.includes(preference)) {
      this.authPreference = preference;
      localStorage.setItem('authPreference', preference);
      return true;
    }
    return false;
  }

  getAuthPreference() {
    if (!this.authPreference) {
      this.authPreference = localStorage.getItem('authPreference') || 'both';
    }
    return this.authPreference;
  }

  getWebAuthnOptions() {
    const preference = this.getAuthPreference();
    
    if (preference === 'device' && this.capabilities.platformAuthenticator) {
      return {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      };
    } else if (preference === 'pin') {
      return {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'required'
      };
    } else {
      // 'both' or fallback - let browser decide
      return {
        userVerification: 'required'
      };
    }
  }

  async testAuthenticationMethod(method) {
    try {
      if (method === 'device' && !this.capabilities.platformAuthenticator) {
        return { available: false, error: 'Platform authenticator not available' };
      }
      
      // Test WebAuthn support for the method
      const options = this.getWebAuthnOptions();
      return { available: true, options };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  getFallbackMethod(primaryMethod) {
    if (primaryMethod === 'device') {
      return 'pin';
    } else if (primaryMethod === 'pin') {
      return this.capabilities.platformAuthenticator ? 'device' : null;
    }
    return null;
  }

  isMethodAvailable(method) {
    return this.capabilities.availableMethods.includes(method);
  }

  getCapabilities() {
    return { ...this.capabilities };
  }
}

export default new DeviceCapabilitiesService();
