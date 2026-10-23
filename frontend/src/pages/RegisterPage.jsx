import React, { useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("Software Engineer");
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState(20);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        title,
        weeklyCapacityHours: Number(weeklyCapacityHours) || 20,
      });
    } catch (err) {
      setError(err.message || "Registration failed.");
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
          width: "min(100%, 440px)",
          background: "#111729",
          border: "1px solid #252d42",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 20px 60px #0008",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div className="brand-mark" style={{ width: "40px", height: "40px" }}>
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <strong style={{ fontSize: "19px" }}>
              TeamPulse<span style={{ color: "#a99dff" }}>AI</span>
            </strong>
            <small style={{ display: "block", color: "#818ba5", fontSize: "9px" }}>
              CREATE ACCOUNT
            </small>
          </div>
        </div>

        <h1 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e8ebf5" }}>Create your workspace profile</h1>
        <p style={{ fontSize: "11px", color: "#818ba5", margin: "0 0 20px" }}>
          Join your college team and configure your expected weekly capacity.
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
            Full Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanya Sharma"
              required
            />
          </label>

          <label className="form-label" style={{ margin: 0 }}>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sanya@example.com"
              required
            />
          </label>

          <label className="form-label" style={{ margin: 0 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create secure password"
              required
            />
          </label>

          <div className="form-row">
            <label className="form-label" style={{ margin: 0 }}>
              Primary Role / Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Frontend Developer"
              />
            </label>

            <label className="form-label" style={{ margin: 0 }}>
              Weekly Capacity (h)
              <input
                type="number"
                min="5"
                max="60"
                value={weeklyCapacityHours}
                onChange={(e) => setWeeklyCapacityHours(e.target.value)}
              />
            </label>
          </div>

          <button
            type="submit"
            className="button-primary"
            disabled={loading}
            style={{ height: "40px", width: "100%", marginTop: "10px" }}
          >
            {loading ? "Registering..." : "Create Account & Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#818ba5" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: "transparent", border: 0, color: "#9b8cff", cursor: "pointer", fontWeight: 600 }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
