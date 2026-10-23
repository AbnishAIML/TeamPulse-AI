import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Zap, Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock } from "lucide-react";
import { authAPI } from "../services/api";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Request Reset State
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New Password State (when token is in URL)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Submit Email for Reset Instructions
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide your account email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password with Token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setResetSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired password reset token.");
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
              {token ? "SET NEW PASSWORD" : "PASSWORD RECOVERY"}
            </small>
          </div>
        </div>

        {/* ==================== FORM SCENARIO A: RESET WITH TOKEN ==================== */}
        {token ? (
          resetSuccess ? (
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
              <strong style={{ fontSize: "14px", color: "#e8ebf5", display: "block", marginBottom: "6px" }}>
                Password Updated Successfully
              </strong>
              <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", margin: "0 0 20px" }}>
                Your password has been reset securely. All previous active sessions have been invalidated.
              </p>
              <Link
                to="/login"
                className="button-primary"
                style={{ textDecoration: "none", display: "inline-flex", height: "36px", padding: "0 16px" }}
              >
                <ArrowLeft size={14} /> Sign In with New Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e8ebf5" }}>
                  Create a new password
                </h1>
                <p style={{ fontSize: "11px", color: "#818ba5", margin: 0 }}>
                  Enter your new password below (minimum 8 characters).
                </p>
              </div>

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
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </label>

              <label className="form-label" style={{ margin: 0 }}>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </label>

              <button
                type="submit"
                className="button-primary"
                disabled={loading}
                style={{ height: "40px", width: "100%", marginTop: "4px" }}
              >
                {loading ? "Resetting..." : "Set New Password"}
              </button>

              <div style={{ textAlign: "center", fontSize: "11px", color: "#818ba5", marginTop: "8px" }}>
                <Link to="/login" style={{ color: "#9b8cff", textDecoration: "none", fontWeight: 600 }}>
                  Back to Sign In
                </Link>
              </div>
            </form>
          )
        ) : (
          /* ==================== FORM SCENARIO B: REQUEST RECOVERY LINK ==================== */
          submitted ? (
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
                Request Processed
              </strong>
              <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", margin: "0 0 20px" }}>
                If an account with <strong>{email}</strong> exists, password reset instructions have been generated. In local development without external email transport, reset links are printed directly to the backend terminal console.
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
            <form onSubmit={handleRequestReset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e8ebf5" }}>
                  Reset your password
                </h1>
                <p style={{ fontSize: "11px", color: "#818ba5", margin: 0 }}>
                  Enter the email associated with your workspace account to generate password recovery instructions.
                </p>
              </div>

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
                {loading ? "Processing..." : "Send Reset Instructions"}
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
          )
        )}
      </div>
    </div>
  );
}
