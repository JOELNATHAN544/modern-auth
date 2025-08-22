import React, { useState, useEffect } from "react";
import {
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  RotateCcw,
} from "lucide-react";
import deviceCapabilities from "../services/deviceCapabilities";
import webauthnService from "../services/webauthnService";

const MultiModalTest = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      const caps = await deviceCapabilities.detectCapabilities();
      setCapabilities(caps);
      addLog("info", "Device capabilities detected", caps);
    } catch (error) {
      addLog("error", "Failed to detect device capabilities", error);
    }
  };

  const addLog = (level, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      level,
      message,
      data,
    };
    setLogs((prev) => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setLogs([]);

    addLog(
      "info",
      "Starting comprehensive multi-modal authentication tests...",
    );

    try {
      // Test 1: Device Capabilities
      await testDeviceCapabilities();

      // Test 2: Authentication Methods
      await testAuthenticationMethods();

      // Test 3: Fallback Mechanisms
      await testFallbackMechanisms();

      // Test 4: Cross-Platform Compatibility
      await testCrossPlatformCompatibility();

      addLog("success", "All tests completed successfully!");
    } catch (error) {
      addLog("error", "Test suite failed", error);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const testDeviceCapabilities = async () => {
    setCurrentTest("Device Capabilities");
    addLog("info", "Testing device capabilities...");

    const results = {
      webauthnSupported: capabilities?.webauthnSupported || false,
      platformAuthenticator: capabilities?.platformAuthenticator || false,
      userVerification: capabilities?.userVerification || false,
      secureContext: capabilities?.secureContext || false,
      httpsOrLocalhost: capabilities?.httpsOrLocalhost || false,
      availableMethods: capabilities?.availableMethods || [],
    };

    setTestResults((prev) => ({ ...prev, deviceCapabilities: results }));
    addLog("success", "Device capabilities test completed", results);

    return results;
  };

  const testAuthenticationMethods = async () => {
    setCurrentTest("Authentication Methods");
    addLog("info", "Testing authentication methods...");

    const methods = capabilities?.availableMethods || [];
    const results = {};

    for (const method of methods) {
      try {
        addLog("info", `Testing method: ${method}`);
        const testResult =
          await webauthnService.testAuthenticationMethod(method);
        results[method] = testResult;
        addLog("success", `Method ${method} test completed`, testResult);
      } catch (error) {
        results[method] = { available: false, error: error.message };
        addLog("error", `Method ${method} test failed`, error);
      }
    }

    setTestResults((prev) => ({ ...prev, authenticationMethods: results }));
    addLog("success", "Authentication methods test completed", results);

    return results;
  };

  const testFallbackMechanisms = async () => {
    setCurrentTest("Fallback Mechanisms");
    addLog("info", "Testing fallback mechanisms...");

    const results = {};
    const methods = capabilities?.availableMethods || [];

    for (const method of methods) {
      try {
        const fallbackMethod = deviceCapabilities.getFallbackMethod(method);
        results[method] = {
          hasFallback: !!fallbackMethod,
          fallbackMethod,
          fallbackAvailable: fallbackMethod
            ? capabilities?.availableMethods.includes(fallbackMethod)
            : false,
        };
        addLog("info", `Fallback for ${method}: ${fallbackMethod || "none"}`);
      } catch (error) {
        results[method] = { hasFallback: false, error: error.message };
        addLog("error", `Fallback test for ${method} failed`, error);
      }
    }

    setTestResults((prev) => ({ ...prev, fallbackMechanisms: results }));
    addLog("success", "Fallback mechanisms test completed", results);

    return results;
  };

  const testCrossPlatformCompatibility = async () => {
    setCurrentTest("Cross-Platform Compatibility");
    addLog("info", "Testing cross-platform compatibility...");

    const results = {
      platformAuthenticator: capabilities?.platformAuthenticator || false,
      crossPlatformSupported: true, // WebAuthn always supports cross-platform
      mixedModeSupported:
        capabilities?.availableMethods.includes("both") || false,
      userVerificationRequired: true,
    };

    setTestResults((prev) => ({
      ...prev,
      crossPlatformCompatibility: results,
    }));
    addLog("success", "Cross-platform compatibility test completed", results);

    return results;
  };

  const stopTests = () => {
    setIsRunning(false);
    setCurrentTest(null);
    addLog("warning", "Tests stopped by user");
  };

  const resetTests = () => {
    setTestResults({});
    setLogs([]);
    addLog("info", "Test results reset");
  };

  const getTestStatus = (testName) => {
    const test = testResults[testName];
    if (!test) return "pending";
    if (test.error) return "failed";
    return "passed";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "passed":
        return <CheckCircle size={16} color="#28a745" />;
      case "failed":
        return <AlertTriangle size={16} color="#dc3545" />;
      case "pending":
        return <Settings size={16} color="#6c757d" />;
      default:
        return <Settings size={16} color="#6c757d" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "passed":
        return "#28a745";
      case "failed":
        return "#dc3545";
      case "pending":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  if (!capabilities) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading"></div>
          <p>Initializing multi-modal test suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} color="#007bff" />
          <h1 style={{ fontSize: "24px", fontWeight: "600" }}>
            Multi-Modal Authentication Test Suite
          </h1>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="btn btn-success"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Play size={16} />
            {isRunning ? "Running..." : "Run All Tests"}
          </button>

          {isRunning && (
            <button
              onClick={stopTests}
              className="btn btn-warning"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Square size={16} />
              Stop Tests
            </button>
          )}

          <button
            onClick={resetTests}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div
            className="card"
            style={{ background: "#2a2a2a", marginBottom: "16px" }}
          >
            <div className="flex items-center gap-2">
              <div className="loading"></div>
              <span>Currently testing: {currentTest}</span>
            </div>
          </div>
        )}

        {/* Test Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Device Capabilities */}
          <div className="card" style={{ background: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(getTestStatus("deviceCapabilities"))}
              <span style={{ fontWeight: "500" }}>Device Capabilities</span>
            </div>
            {testResults.deviceCapabilities && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>WebAuthn Support:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.deviceCapabilities.webauthnSupported
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    {testResults.deviceCapabilities.webauthnSupported
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Auth:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.deviceCapabilities.platformAuthenticator
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    {testResults.deviceCapabilities.platformAuthenticator
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Secure Context:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.deviceCapabilities.secureContext
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    {testResults.deviceCapabilities.secureContext ? "✅" : "❌"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available Methods:</span>
                  <span>
                    {testResults.deviceCapabilities.availableMethods?.length ||
                      0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Methods */}
          <div className="card" style={{ background: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(getTestStatus("authenticationMethods"))}
              <span style={{ fontWeight: "500" }}>Authentication Methods</span>
            </div>
            {testResults.authenticationMethods && (
              <div className="space-y-2 text-sm">
                {Object.entries(testResults.authenticationMethods).map(
                  ([method, result]) => (
                    <div key={method} className="flex justify-between">
                      <span style={{ textTransform: "capitalize" }}>
                        {method}:
                      </span>
                      <span
                        style={{
                          color: getStatusColor(
                            result.available ? "passed" : "failed",
                          ),
                        }}
                      >
                        {result.available ? "✅" : "❌"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Fallback Mechanisms */}
          <div className="card" style={{ background: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(getTestStatus("fallbackMechanisms"))}
              <span style={{ fontWeight: "500" }}>Fallback Mechanisms</span>
            </div>
            {testResults.fallbackMechanisms && (
              <div className="space-y-2 text-sm">
                {Object.entries(testResults.fallbackMechanisms).map(
                  ([method, result]) => (
                    <div key={method} className="flex justify-between">
                      <span style={{ textTransform: "capitalize" }}>
                        {method}:
                      </span>
                      <span
                        style={{
                          color: getStatusColor(
                            result.hasFallback ? "passed" : "failed",
                          ),
                        }}
                      >
                        {result.fallbackMethod || "none"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Cross-Platform Compatibility */}
          <div className="card" style={{ background: "#2a2a2a" }}>
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(getTestStatus("crossPlatformCompatibility"))}
              <span style={{ fontWeight: "500" }}>Cross-Platform</span>
            </div>
            {testResults.crossPlatformCompatibility && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Platform Auth:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.crossPlatformCompatibility
                          .platformAuthenticator
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    {testResults.crossPlatformCompatibility
                      .platformAuthenticator
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cross-Platform:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.crossPlatformCompatibility
                          .crossPlatformSupported
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    ✅
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mixed Mode:</span>
                  <span
                    style={{
                      color: getStatusColor(
                        testResults.crossPlatformCompatibility
                          .mixedModeSupported
                          ? "passed"
                          : "failed",
                      ),
                    }}
                  >
                    {testResults.crossPlatformCompatibility.mixedModeSupported
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Logs */}
        <div className="card" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} color="#007bff" />
            <span style={{ fontWeight: "500" }}>Test Logs</span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 text-sm p-2 rounded"
                style={{
                  background:
                    log.level === "error"
                      ? "#2d1b1b"
                      : log.level === "warning"
                        ? "#2d2b1b"
                        : log.level === "success"
                          ? "#1b2d1b"
                          : "#1b1b2d",
                }}
              >
                <span style={{ color: "#888", fontSize: "12px" }}>
                  {log.timestamp}
                </span>
                <span
                  style={{
                    color:
                      log.level === "error"
                        ? "#dc3545"
                        : log.level === "warning"
                          ? "#ffc107"
                          : log.level === "success"
                            ? "#28a745"
                            : "#007bff",
                  }}
                >
                  [{log.level.toUpperCase()}]
                </span>
                <span>{log.message}</span>
                {log.data && (
                  <details className="ml-2">
                    <summary style={{ cursor: "pointer", fontSize: "12px" }}>
                      Details
                    </summary>
                    <pre
                      style={{
                        fontSize: "11px",
                        marginTop: "4px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No test logs yet. Run tests to see results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiModalTest;
