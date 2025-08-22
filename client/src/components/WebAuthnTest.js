import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const WebAuthnTest = () => {
  const [tests, setTests] = useState({
    webauthnSupported: false,
    platformAuthenticator: false,
    userVerification: false,
    secureContext: false,
    httpsOrLocalhost: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const testResults = {
      webauthnSupported: false,
      platformAuthenticator: false,
      userVerification: false,
      secureContext: false,
      httpsOrLocalhost: false,
    };

    // Test 1: WebAuthn Support
    try {
      testResults.webauthnSupported = !!window.PublicKeyCredential;
    } catch (error) {
      console.error("WebAuthn support test failed:", error);
    }

    // Test 2: Platform Authenticator
    try {
      if (
        testResults.webauthnSupported &&
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        testResults.platformAuthenticator =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch (error) {
      console.error("Platform authenticator test failed:", error);
    }

    // Test 3: User Verification
    try {
      testResults.userVerification = testResults.platformAuthenticator;
    } catch (error) {
      console.error("User verification test failed:", error);
    }

    // Test 4: Secure Context
    try {
      testResults.secureContext = window.isSecureContext;
    } catch (error) {
      console.error("Secure context test failed:", error);
    }

    // Test 5: HTTPS or Localhost
    try {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes("localhost");
      testResults.httpsOrLocalhost =
        window.location.protocol === "https:" || isLocalhost;
    } catch (error) {
      console.error("HTTPS/localhost test failed:", error);
    }

    setTests(testResults);
    setLoading(false);
  };

  const getTestIcon = (passed) => {
    return passed ? (
      <CheckCircle size={16} color="#28a745" />
    ) : (
      <XCircle size={16} color="#dc3545" />
    );
  };

  const getTestStatus = (passed) => {
    return passed ? "Passed" : "Failed";
  };

  const getTestColor = (passed) => {
    return passed ? "#28a745" : "#dc3545";
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading"></div>
          <p className="mt-4">Running WebAuthn compatibility tests...</p>
        </div>
      </div>
    );
  }

  const allTestsPassed = Object.values(tests).every((test) => test);

  return (
    <div className="container">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} color="#007bff" />
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "600" }}>
              WebAuthn Compatibility Test
            </h1>
            <p className="text-muted">Check if your device supports passkeys</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          {allTestsPassed ? (
            <CheckCircle size={24} color="#28a745" />
          ) : (
            <AlertTriangle size={24} color="#ffc107" />
          )}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600" }}>
              {allTestsPassed ? "All Tests Passed!" : "Some Tests Failed"}
            </h3>
            <p className="text-muted">
              {allTestsPassed
                ? "Your device supports WebAuthn passkeys"
                : "Your device may have compatibility issues with passkeys"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="flex items-center justify-between p-3"
            style={{ background: "#2a2a2a", borderRadius: "8px" }}
          >
            <div className="flex items-center gap-3">
              {getTestIcon(tests.webauthnSupported)}
              <span>WebAuthn API Support</span>
            </div>
            <span
              style={{
                color: getTestColor(tests.webauthnSupported),
                fontWeight: "600",
              }}
            >
              {getTestStatus(tests.webauthnSupported)}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-3"
            style={{ background: "#2a2a2a", borderRadius: "8px" }}
          >
            <div className="flex items-center gap-3">
              {getTestIcon(tests.platformAuthenticator)}
              <span>Platform Authenticator</span>
            </div>
            <span
              style={{
                color: getTestColor(tests.platformAuthenticator),
                fontWeight: "600",
              }}
            >
              {getTestStatus(tests.platformAuthenticator)}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-3"
            style={{ background: "#2a2a2a", borderRadius: "8px" }}
          >
            <div className="flex items-center gap-3">
              {getTestIcon(tests.userVerification)}
              <span>User Verification</span>
            </div>
            <span
              style={{
                color: getTestColor(tests.userVerification),
                fontWeight: "600",
              }}
            >
              {getTestStatus(tests.userVerification)}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-3"
            style={{ background: "#2a2a2a", borderRadius: "8px" }}
          >
            <div className="flex items-center gap-3">
              {getTestIcon(tests.secureContext)}
              <span>Secure Context</span>
            </div>
            <span
              style={{
                color: getTestColor(tests.secureContext),
                fontWeight: "600",
              }}
            >
              {getTestStatus(tests.secureContext)}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-3"
            style={{ background: "#2a2a2a", borderRadius: "8px" }}
          >
            <div className="flex items-center gap-3">
              {getTestIcon(tests.httpsOrLocalhost)}
              <span>HTTPS or Localhost</span>
            </div>
            <span
              style={{
                color: getTestColor(tests.httpsOrLocalhost),
                fontWeight: "600",
              }}
            >
              {getTestStatus(tests.httpsOrLocalhost)}
            </span>
          </div>
        </div>
      </div>

      {!allTestsPassed && (
        <div
          className="card"
          style={{ background: "#fff3cd", border: "1px solid #ffeaa7" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} color="#856404" />
            <span style={{ fontWeight: "600", color: "#856404" }}>
              Recommendations
            </span>
          </div>
          <ul
            style={{ fontSize: "14px", color: "#856404", paddingLeft: "20px" }}
          >
            {!tests.webauthnSupported && (
              <li>
                Update to a modern browser (Chrome 67+, Firefox 60+, Safari 13+,
                Edge 18+)
              </li>
            )}
            {!tests.platformAuthenticator && (
              <li>Your device may not support biometric authentication</li>
            )}
            {!tests.secureContext && (
              <li>WebAuthn requires a secure context (HTTPS or localhost)</li>
            )}
            {!tests.httpsOrLocalhost && (
              <li>Use HTTPS or localhost for WebAuthn to work</li>
            )}
            <li>Try using the demo mode for testing the application</li>
          </ul>
        </div>
      )}

      <div className="card">
        <h3
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}
        >
          Browser Information
        </h3>
        <div className="space-y-2" style={{ fontSize: "14px", color: "#ccc" }}>
          <div className="flex justify-between">
            <span>User Agent:</span>
            <span style={{ wordBreak: "break-all" }}>
              {navigator.userAgent}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Protocol:</span>
            <span>{window.location.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span>Hostname:</span>
            <span>{window.location.hostname}</span>
          </div>
          <div className="flex justify-between">
            <span>Secure Context:</span>
            <span>{window.isSecureContext ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button onClick={runTests} className="btn btn-secondary">
          🔄 Run Tests Again
        </button>
      </div>
    </div>
  );
};

export default WebAuthnTest;
