import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const navigate = useNavigate ? useNavigate() : null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState("Software Engineer");
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState(20);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", color: "#818ba5" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "#ff8c9c" };
    if (score === 2 || score === 3) return { score: 2, label: "Moderate", color: "#ffbd7c" };
    return { score: 3, label: "Strong", color: "#72dcb5" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
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
      if (navigate) navigate("/dashboard");
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
          Join your software team and configure your expected weekly capacity.
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

          <label className="form-label" style={{ margin: 0, position: "relative" }}>
            Password
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password (min 8 chars)"
                required
                style={{ paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  color: "#818ba5",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: strength.color }}>
                  <span>Password strength: <strong>{strength.label}</strong></span>
                  <span>{password.length >= 8 ? "✓ Length ok" : "Min 8 chars required"}</span>
                </div>
                <div style={{ height: "4px", background: "#20283b", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(strength.score / 3) * 100}%`,
                      background: strength.color,
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              </div>
            )}
          </label>

          <div className="form-row">
            <label className="form-label" style={{ margin: 0 }}>
              Primary Role / Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Software Engineer"
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
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{ background: "transparent", border: 0, color: "#9b8cff", cursor: "pointer", fontWeight: 600 }}
            >
              Sign in
            </button>
          ) : (
            <Link
              to="/login"
              style={{ color: "#9b8cff", textDecoration: "none", fontWeight: 600 }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
