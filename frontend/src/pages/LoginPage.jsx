import React, { useState } from "react";
import { Zap, AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage({ onSwitchToRegister }) {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setError("");
    setLoading(true);
    try {
      await demoLogin(demoEmail);
    } catch (err) {
      setError("Demo login failed. Make sure backend is running and seeded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#080c18",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          background: "#111729",
          border: "1px solid #252d42",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 20px 60px #0008",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div className="brand-mark" style={{ width: "42px", height: "42px" }}>
            <Zap size={22} fill="currentColor" />
          </div>
          <div>
            <strong style={{ fontSize: "20px", letterSpacing: "-0.5px" }}>
              TeamPulse<span style={{ color: "#a99dff" }}>AI</span>
            </strong>
            <small style={{ display: "block", color: "#818ba5", fontSize: "9px", letterSpacing: "1px" }}>
              COLLEGE DEMO PORTAL
            </small>
          </div>
        </div>

        <h1 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e8ebf5" }}>Sign in to your workspace</h1>
        <p style={{ fontSize: "11px", color: "#818ba5", margin: "0 0 20px" }}>
          Access intelligent project management, DAG scheduling, and workload analytics.
        </p>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#432a34",
              color: "#ff9ca9",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "11px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="form-label" style={{ margin: 0 }}>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ankit@teampulse.ai"
              required
            />
          </label>

          <label className="form-label" style={{ margin: 0 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button
            type="submit"
            className="button-primary"
            disabled={loading}
            style={{ height: "40px", width: "100%", marginTop: "8px" }}
          >
            {loading ? "Signing in..." : "Sign in to Platform"}
          </button>
        </form>

        {/* 1-Click College Demo Accounts */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #20283b" }}>
          <span
            style={{
              fontSize: "9px",
              color: "#818ba5",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: 700,
              display: "block",
              marginBottom: "10px",
            }}
          >
            Instant Demo Sign-In (Evaluation Mode)
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleQuickDemo("ankit@teampulse.ai")}
              style={{
                background: "#161b2e",
                border: "1px solid #28334e",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#e8ebf5",
                fontSize: "10px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", color: "#a9d0ff" }}>Ankit Kumar</strong>
              <small style={{ color: "#818ba5" }}>Project Owner</small>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("rahul@teampulse.ai")}
              style={{
                background: "#161b2e",
                border: "1px solid #28334e",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#e8ebf5",
                fontSize: "10px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", color: "#b9afff" }}>Rahul Sharma</strong>
              <small style={{ color: "#ff9ca9" }}>Overloaded (24h)</small>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("priya@teampulse.ai")}
              style={{
                background: "#161b2e",
                border: "1px solid #28334e",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#e8ebf5",
                fontSize: "10px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", color: "#ffc2dc" }}>Priya Mehta</strong>
              <small style={{ color: "#ffbd7c" }}>Blocked Task</small>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("arjun@teampulse.ai")}
              style={{
                background: "#161b2e",
                border: "1px solid #28334e",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#e8ebf5",
                fontSize: "10px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", color: "#a7f0d7" }}>Arjun Verma</strong>
              <small style={{ color: "#72dcb5" }}>QA / Reviewer</small>
            </button>
          </div>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#818ba5" }}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: "transparent", border: 0, color: "#9b8cff", cursor: "pointer", fontWeight: 600 }}
          >
            Register new user
          </button>
        </div>
      </div>
    </div>
  );
}
