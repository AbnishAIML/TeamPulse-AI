import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide your account email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // In development / local environment, simulate password reset link generation
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
    } catch (err) {
      setError("Unable to process password reset request.");
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div className="brand-mark" style={{ width: "40px", height: "40px" }}>
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <strong style={{ fontSize: "19px" }}>
              TeamPulse<span style={{ color: "#a99dff" }}>AI</span>
            </strong>
            <small style={{ display: "block", color: "#818ba5", fontSize: "9px" }}>
              PASSWORD RECOVERY
            </small>
          </div>
        </div>

        <h1 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e8ebf5" }}>
          Reset your password
        </h1>
        <p style={{ fontSize: "11px", color: "#818ba5", margin: "0 0 20px" }}>
          Enter the email associated with your workspace account to receive recovery instructions.
        </p>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#19332c",
                color: "#72dcb5",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 12px",
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <strong style={{ fontSize: "13px", color: "#e8ebf5", display: "block", marginBottom: "6px" }}>
              Recovery Instructions Dispatched
            </strong>
            <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", margin: "0 0 20px" }}>
              If an account is registered with <strong>{email}</strong>, password reset guidance has been sent. In local development without SMTP, password resets can be performed directly by a project owner.
            </p>
            <Link
              to="/login"
              className="button-primary"
              style={{ textDecoration: "none", display: "inline-flex", height: "36px", padding: "0 16px" }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                }}
              >
                <AlertCircle size={15} /> {error}
              </div>
            )}

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

            <button
              type="submit"
              className="button-primary"
              disabled={loading}
              style={{ height: "40px", width: "100%", marginTop: "4px" }}
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>

            <div style={{ textAlign: "center", fontSize: "11px", color: "#818ba5", marginTop: "8px" }}>
              Remembered your password?{" "}
              <Link
                to="/login"
                style={{ color: "#9b8cff", textDecoration: "none", fontWeight: 600 }}
              >
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
