import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import deviceCapabilities from "./deviceCapabilities";

class WebAuthnService {
  constructor() {
    this.currentChallenge = null;
    this.authAttempts = 0;
    this.maxAuthAttempts = 3;
  }

  async register(email, username, displayName) {
    try {
      // Detect device capabilities first
      await deviceCapabilities.detectCapabilities();

      // Get user's authentication preference
      const authPreference = deviceCapabilities.getAuthPreference();

      // Begin registration with preferred method
      const beginResponse = await this.beginRegistration(
        email,
        username,
        displayName,
        authPreference,
      );

      if (!beginResponse.success) {
        throw new Error(beginResponse.error);
      }

      // Start WebAuthn registration
      const credential = await startRegistration(beginResponse.options);

      // Complete registration
      const completeResponse = await this.completeRegistration(
        credential,
        beginResponse.challenge,
      );

      if (completeResponse.success) {
        // Store successful registration
        localStorage.setItem("registeredEmail", email);
        return completeResponse;
      } else {
        throw new Error(completeResponse.error);
      }
    } catch (error) {
      console.error("Registration failed:", error);

      // Try fallback method if primary method failed
      return await this.tryFallbackRegistration(
        email,
        username,
        displayName,
        error,
      );
    }
  }

  async beginRegistration(email, username, displayName, authMethod) {
    try {
      const response = await fetch("/api/auth/register/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          displayName: displayName || username,
          authMethod: authMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();
      return { success: true, options: data, challenge: data.challenge };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async completeRegistration(credential, challenge) {
    try {
      const response = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          expectedChallenge: challenge,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration completion failed");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async tryFallbackRegistration(email, username, displayName, originalError) {
    const capabilities = deviceCapabilities.getCapabilities();
    const fallbackMethod = deviceCapabilities.getFallbackMethod(
      deviceCapabilities.getAuthPreference(),
    );

    if (
      !fallbackMethod ||
      !capabilities.availableMethods.includes(fallbackMethod)
    ) {
      throw new Error(
        `Registration failed: ${originalError.message}. No fallback method available.`,
      );
    }

    console.log(`Trying fallback registration with method: ${fallbackMethod}`);

    try {
      // Update preference temporarily for fallback
      const originalPreference = deviceCapabilities.getAuthPreference();
      deviceCapabilities.setAuthPreference(fallbackMethod);

      // Retry registration with fallback method
      const beginResponse = await this.beginRegistration(
        email,
        username,
        displayName,
        fallbackMethod,
      );

      if (!beginResponse.success) {
        throw new Error(beginResponse.error);
      }

      const credential = await startRegistration(beginResponse.options);
      const completeResponse = await this.completeRegistration(
        credential,
        beginResponse.challenge,
      );

      // Restore original preference
      deviceCapabilities.setAuthPreference(originalPreference);

      if (completeResponse.success) {
        localStorage.setItem("registeredEmail", email);
        return { ...completeResponse, usedFallback: true, fallbackMethod };
      } else {
        throw new Error(completeResponse.error);
      }
    } catch (error) {
      // Restore original preference
      deviceCapabilities.setAuthPreference(
        deviceCapabilities.getAuthPreference(),
      );
      throw new Error(`Fallback registration failed: ${error.message}`);
    }
  }

  async authenticate(email, authMethod = null) {
    try {
      // Reset auth attempts
      this.authAttempts = 0;

      // Detect device capabilities
      await deviceCapabilities.detectCapabilities();

      // Use provided method or user preference
      const method = authMethod || deviceCapabilities.getAuthPreference();

      // Begin authentication
      const beginResponse = await this.beginAuthentication(email, method);

      if (!beginResponse.success) {
        throw new Error(beginResponse.error);
      }

      // Start WebAuthn authentication
      const credential = await startAuthentication(beginResponse.options);

      // Complete authentication
      const completeResponse = await this.completeAuthentication(
        credential,
        beginResponse.challenge,
      );

      if (completeResponse.success) {
        return completeResponse;
      } else {
        throw new Error(completeResponse.error);
      }
    } catch (error) {
      console.error("Authentication failed:", error);

      // Try fallback method if primary method failed
      return await this.tryFallbackAuthentication(email, error);
    }
  }

  async beginAuthentication(email, authMethod) {
    try {
      const response = await fetch("/api/auth/login/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          authMethod: authMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Authentication failed");
      }

      const data = await response.json();
      return { success: true, options: data, challenge: data.challenge };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async completeAuthentication(credential, challenge) {
    try {
      const response = await fetch("/api/auth/login/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          expectedChallenge: challenge,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Authentication completion failed");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async tryFallbackAuthentication(email, originalError) {
    const capabilities = deviceCapabilities.getCapabilities();
    const fallbackMethod = deviceCapabilities.getFallbackMethod(
      deviceCapabilities.getAuthPreference(),
    );

    if (
      !fallbackMethod ||
      !capabilities.availableMethods.includes(fallbackMethod)
    ) {
      throw new Error(
        `Authentication failed: ${originalError.message}. No fallback method available.`,
      );
    }

    console.log(
      `Trying fallback authentication with method: ${fallbackMethod}`,
    );

    try {
      // Update preference temporarily for fallback
      const originalPreference = deviceCapabilities.getAuthPreference();
      deviceCapabilities.setAuthPreference(fallbackMethod);

      // Retry authentication with fallback method
      const beginResponse = await this.beginAuthentication(
        email,
        fallbackMethod,
      );

      if (!beginResponse.success) {
        throw new Error(beginResponse.error);
      }

      const credential = await startAuthentication(beginResponse.options);
      const completeResponse = await this.completeAuthentication(
        credential,
        beginResponse.challenge,
      );

      // Restore original preference
      deviceCapabilities.setAuthPreference(originalPreference);

      if (completeResponse.success) {
        return { ...completeResponse, usedFallback: true, fallbackMethod };
      } else {
        throw new Error(completeResponse.error);
      }
    } catch (error) {
      // Restore original preference
      deviceCapabilities.setAuthPreference(
        deviceCapabilities.getAuthPreference(),
      );
      throw new Error(`Fallback authentication failed: ${error.message}`);
    }
  }

  async testAuthenticationMethod(method) {
    return await deviceCapabilities.testAuthenticationMethod(method);
  }

  getAvailableMethods() {
    return deviceCapabilities.getCapabilities().availableMethods;
  }

  setAuthPreference(preference) {
    return deviceCapabilities.setAuthPreference(preference);
  }

  getAuthPreference() {
    return deviceCapabilities.getAuthPreference();
  }

  resetAuthAttempts() {
    this.authAttempts = 0;
  }

  incrementAuthAttempts() {
    this.authAttempts++;
    return this.authAttempts;
  }

  hasExceededMaxAttempts() {
    return this.authAttempts >= this.maxAuthAttempts;
  }
}

export default new WebAuthnService();
