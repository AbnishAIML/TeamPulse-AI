import React, { useState } from "react";
import { Zap, AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
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
              placeholder="your.email@organization.com"
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

        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #20283b", fontSize: "11px", color: "#818ba5", textAlign: "center" }}>
          <span>Tip: To populate an optional test workspace, run <code>npm run seed:demo</code> (demo login: <code>lead@demo.local / demo1234</code>).</span>
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
