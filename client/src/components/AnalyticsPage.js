import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Activity,
} from "lucide-react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get("/api/analytics/conversion");
      setAnalytics(response.data);
      setError(null);
    } catch (error) {
      setError("Failed to fetch analytics data");
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading"></div>
          <p className="mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center">
          <p style={{ color: "#dc3545" }}>{error}</p>
          <button onClick={fetchAnalytics} className="btn mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const conversionData = [
    {
      name: "Password",
      started: analytics.password.started,
      completed: analytics.password.completed,
      conversionRate: parseFloat(analytics.password.conversionRate),
      fill: "#dc3545",
    },
    {
      name: "Passkey",
      started: analytics.passkey.started,
      completed: analytics.passkey.completed,
      conversionRate: parseFloat(analytics.passkey.conversionRate),
      fill: "#28a745",
    },
  ];

  const stepUpData = [
    {
      name: "Triggered",
      value: analytics.stepUpAuth.triggered,
      fill: "#ffc107",
    },
    {
      name: "Completed",
      value: analytics.stepUpAuth.completed,
      fill: "#28a745",
    },
  ];

  const getDeltaColor = () => {
    const delta = parseFloat(analytics.delta.percentage);
    return delta > 0 ? "#28a745" : delta < 0 ? "#dc3545" : "#6c757d";
  };

  const getDeltaIcon = () => {
    const delta = parseFloat(analytics.delta.percentage);
    return delta > 0 ? (
      <TrendingUp size={20} />
    ) : delta < 0 ? (
      <TrendingDown size={20} />
    ) : null;
  };

  return (
    <div>
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={24} color="#007bff" />
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "600" }}>
              Analytics Dashboard
            </h1>
            <p className="text-muted">
              Conversion rates and authentication metrics
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-3">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Users size={20} color="#007bff" />
            <span style={{ fontWeight: "600" }}>Total Signups</span>
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}
          >
            {analytics.password.started + analytics.passkey.started}
          </div>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Password: {analytics.password.started} | Passkey:{" "}
            {analytics.passkey.started}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={20} color="#28a745" />
            <span style={{ fontWeight: "600" }}>Successful Conversions</span>
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}
          >
            {analytics.password.completed + analytics.passkey.completed}
          </div>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Password: {analytics.password.completed} | Passkey:{" "}
            {analytics.passkey.completed}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Activity size={20} color={getDeltaColor()} />
            <span style={{ fontWeight: "600" }}>Conversion Delta</span>
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "4px",
              color: getDeltaColor(),
            }}
          >
            {getDeltaIcon()}
            {analytics.delta.percentage}
          </div>
          <p style={{ fontSize: "14px", color: "#888" }}>
            {analytics.delta.improvement}
          </p>
        </div>
      </div>

      {/* Conversion Rate Comparison */}
      <div className="card">
        <h3
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}
        >
          Conversion Rate Comparison
        </h3>

        <div className="grid grid-2">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="conversionRate" fill="#007bff" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="space-y-4">
              <div className="card" style={{ background: "#2a2a2a" }}>
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#dc3545",
                  }}
                >
                  Password Authentication
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span style={{ fontWeight: "600" }}>
                      {analytics.password.started}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span style={{ fontWeight: "600" }}>
                      {analytics.password.completed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate:</span>
                    <span style={{ fontWeight: "600", color: "#dc3545" }}>
                      {analytics.password.conversionRate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: "#2a2a2a" }}>
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#28a745",
                  }}
                >
                  Passkey Authentication
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span style={{ fontWeight: "600" }}>
                      {analytics.passkey.started}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span style={{ fontWeight: "600" }}>
                      {analytics.passkey.completed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate:</span>
                    <span style={{ fontWeight: "600", color: "#28a745" }}>
                      {analytics.passkey.conversionRate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-up Authentication Metrics */}
      <div className="grid grid-2">
        <div className="card">
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Step-up Authentication
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Transactions:</span>
              <span style={{ fontWeight: "600" }}>
                {analytics.totalTransactions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Step-up Triggered:</span>
              <span style={{ fontWeight: "600", color: "#ffc107" }}>
                {analytics.stepUpAuth.triggered}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Step-up Completed:</span>
              <span style={{ fontWeight: "600", color: "#28a745" }}>
                {analytics.stepUpAuth.completed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate:</span>
              <span style={{ fontWeight: "600" }}>
                {analytics.stepUpAuth.triggered > 0
                  ? (
                      (analytics.stepUpAuth.completed /
                        analytics.stepUpAuth.triggered) *
                      100
                    ).toFixed(1) + "%"
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Step-up Authentication Distribution
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stepUpData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stepUpData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <h3
          style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}
        >
          Key Insights
        </h3>

        <div className="grid grid-2">
          <div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#28a745",
              }}
            >
              Passkey Benefits
            </h4>
            <ul
              style={{ fontSize: "14px", color: "#ccc", paddingLeft: "20px" }}
            >
              <li>Phishing-resistant authentication</li>
              <li>Reduced friction in signup process</li>
              <li>Better user experience</li>
              <li>Higher security standards</li>
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#007bff",
              }}
            >
              Step-up Authentication
            </h4>
            <ul
              style={{ fontSize: "14px", color: "#ccc", paddingLeft: "20px" }}
            >
              <li>PSD3 compliance for banking</li>
              <li>Automatic for transactions > €150</li>
              <li>Additional security layer</li>
              <li>Risk-based authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
