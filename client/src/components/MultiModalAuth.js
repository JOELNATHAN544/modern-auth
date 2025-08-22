import React, { useState, useEffect } from "react";
import {
  Shield,
  Fingerprint,
  Smartphone,
  Key,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import deviceCapabilities from "../services/deviceCapabilities";
import webauthnService from "../services/webauthnService";

const MultiModalAuth = ({ onAuthSuccess, onAuthFailure, mode = "login" }) => {
  const [capabilities, setCapabilities] = useState(null);
  const [authPreference, setAuthPreference] = useState("both");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
  });

  useEffect(() => {
    initializeCapabilities();
  }, []);

  const initializeCapabilities = async () => {
    try {
      const caps = await deviceCapabilities.detectCapabilities();
      setCapabilities(caps);

      const preference = deviceCapabilities.getAuthPreference();
      setAuthPreference(preference);

      // Auto-select method based on capabilities and preference
      if (caps.availableMethods.includes(preference)) {
        setSelectedMethod(preference);
      } else if (caps.availableMethods.includes("both")) {
        setSelectedMethod("both");
      } else {
        setSelectedMethod(caps.availableMethods[0]);
      }
    } catch (error) {
      console.error("Failed to initialize capabilities:", error);
      setError("Failed to detect device capabilities");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMethodSelection = (method) => {
    if (capabilities?.availableMethods.includes(method)) {
      setSelectedMethod(method);
      deviceCapabilities.setAuthPreference(method);
      setAuthPreference(method);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleRegistration();
      }
    } catch (error) {
      setError(error.message);
      onAuthFailure?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.email) {
      throw new Error("Email is required");
    }

    const result = await webauthnService.authenticate(
      formData.email,
      selectedMethod,
    );

    if (result.success) {
      setSuccess("Authentication successful!");
      if (result.usedFallback) {
        setSuccess(
          `Authentication successful using fallback method: ${result.fallbackMethod}`,
        );
      }
      onAuthSuccess?.(result.data);
    } else {
      throw new Error(result.error || "Authentication failed");
    }
  };

  const handleRegistration = async () => {
    if (!formData.email || !formData.username) {
      throw new Error("Email and username are required");
    }

    const result = await webauthnService.register(
      formData.email,
      formData.username,
      formData.displayName || formData.username,
    );

    if (result.success) {
      setSuccess("Registration successful!");
      if (result.usedFallback) {
        setSuccess(
          `Registration successful using fallback method: ${result.fallbackMethod}`,
        );
      }
      onAuthSuccess?.(result.data);
    } else {
      throw new Error(result.error || "Registration failed");
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "device":
        return <Fingerprint size={20} />;
      case "pin":
        return <Key size={20} />;
      case "both":
        return <Smartphone size={20} />;
      default:
        return <Shield size={20} />;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case "device":
        return "Device Authentication";
      case "pin":
        return "PIN/Security Key";
      case "both":
        return "Let Browser Choose";
      default:
        return "Unknown Method";
    }
  };

  const getMethodDescription = (method) => {
    switch (method) {
      case "device":
        return "Use your device's built-in security (Face ID, Fingerprint, PIN)";
      case "pin":
        return "Use a security key or external authenticator with PIN";
      case "both":
        return "Browser will automatically choose the best available method";
      default:
        return "";
    }
  };

  if (!capabilities) {
    return (
      <div className="text-center p-4">
        <div className="loading"></div>
        <p>Detecting device capabilities...</p>
      </div>
    );
  }

  if (!capabilities.webauthnSupported) {
    return (
      <div
        className="card"
        style={{ background: "#fff3cd", border: "1px solid #ffeaa7" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} color="#856404" />
          <span style={{ fontWeight: "600", color: "#856404" }}>
            WebAuthn Not Supported
          </span>
        </div>
        <p style={{ fontSize: "14px", color: "#856404" }}>
          Your browser doesn't support WebAuthn. Please use a modern browser
          like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="text-center mb-4">
        <Shield size={48} style={{ margin: "0 auto 16px", color: "#007bff" }} />
        <h1
          style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}
        >
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-muted">
          {mode === "login"
            ? "Sign in with your preferred method"
            : "Set up secure authentication"}
        </p>
      </div>

      {/* Device Capabilities Status */}
      <div
        className="card"
        style={{ background: "#2a2a2a", marginBottom: "16px" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} color="#007bff" />
          <span style={{ fontWeight: "500", color: "#007bff" }}>
            Device Capabilities
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            {capabilities.platformAuthenticator ? (
              <CheckCircle size={14} color="#28a745" />
            ) : (
              <AlertTriangle size={14} color="#ffc107" />
            )}
            <span>Platform Auth</span>
          </div>
          <div className="flex items-center gap-2">
            {capabilities.secureContext ? (
              <CheckCircle size={14} color="#28a745" />
            ) : (
              <AlertTriangle size={14} color="#ffc107" />
            )}
            <span>Secure Context</span>
          </div>
        </div>
      </div>

      {/* Authentication Method Selection */}
      <div className="mb-4">
        <label className="form-label">Choose Authentication Method</label>
        <div className="grid gap-2">
          {capabilities.availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => handleMethodSelection(method)}
              className={`btn ${selectedMethod === method ? "btn-success" : "btn-secondary"}`}
              style={{
                justifyContent: "flex-start",
                padding: "12px 16px",
                textAlign: "left",
              }}
            >
              <div className="flex items-center gap-3">
                {getMethodIcon(method)}
                <div>
                  <div style={{ fontWeight: "500" }}>
                    {getMethodLabel(method)}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    {getMethodDescription(method)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {mode === "registration" && (
          <>
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
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your display name"
              />
            </div>
          </>
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

        <button
          type="submit"
          className="btn"
          style={{ width: "100%", marginTop: "16px" }}
          disabled={isLoading || !selectedMethod}
        >
          {isLoading ? (
            <>
              <div className="loading"></div>
              {mode === "login" ? "Signing in..." : "Creating account..."}
            </>
          ) : (
            <>
              {getMethodIcon(selectedMethod)}
              {mode === "login" ? "Sign In" : "Create Account"}
            </>
          )}
        </button>
      </form>

      {/* Success/Error Messages */}
      {success && (
        <div
          className="card"
          style={{
            background: "#d4edda",
            border: "1px solid #c3e6cb",
            marginTop: "16px",
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} color="#155724" />
            <span style={{ color: "#155724" }}>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            background: "#f8d7da",
            border: "1px solid #f5c6cb",
            marginTop: "16px",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} color="#721c24" />
            <span style={{ color: "#721c24" }}>{error}</span>
          </div>
        </div>
      )}

      {/* Method Information */}
      {selectedMethod && (
        <div
          className="card"
          style={{ background: "#2a2a2a", marginTop: "16px" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} color="#28a745" />
            <span style={{ fontWeight: "500", color: "#28a745" }}>
              Selected Method
            </span>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              {getMethodIcon(selectedMethod)}
              <span style={{ fontWeight: "500" }}>
                {getMethodLabel(selectedMethod)}
              </span>
            </div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>
              {getMethodDescription(selectedMethod)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiModalAuth;
