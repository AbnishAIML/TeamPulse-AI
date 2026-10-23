import React from "react";
import { Link } from "react-router-dom";
import { Zap, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#080c18",
        color: "#e8ebf5",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#111729",
          border: "1px solid #232c44",
          borderRadius: "16px",
          padding: "36px",
          textAlign: "center",
          boxShadow: "0 20px 60px #0008",
        }}
      >
        <div
          className="brand-mark"
          style={{ width: "48px", height: "48px", margin: "0 auto 20px" }}
        >
          <Zap size={24} fill="currentColor" />
        </div>

        <span
          style={{
            fontSize: "12px",
            color: "#9b8cff",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "6px",
          }}
        >
          404 ERROR
        </span>
        <h1 style={{ fontSize: "24px", margin: "0 0 10px", color: "#fff" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: "12px", color: "#818ba5", lineHeight: "1.6", margin: "0 0 24px" }}>
          The path you requested does not exist or has been relocated within the workspace.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Link
            to="/dashboard"
            className="button-primary"
            style={{ textDecoration: "none", height: "36px", padding: "0 16px" }}
          >
            <Home size={14} /> Go to Dashboard
          </Link>
          <Link
            to="/"
            className="button-secondary"
            style={{ textDecoration: "none", height: "36px", padding: "0 16px" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
