import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { projectsAPI } from "../services/api.js";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No invitation token provided. Please check the invitation URL.");
      return;
    }

    if (!user) {
      // User must be logged in to accept
      return;
    }

    const accept = async () => {
      try {
        const res = await projectsAPI.acceptInvitation(token);
        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message || "Invitation accepted!");
          setProject(res.data.project);
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to accept invitation or invitation has expired.");
      }
    };

    accept();
  }, [token, user]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(ellipse at top, #141b34 0%, #080c18 70%)",
        color: "#e8ebf5",
        padding: "24px",
      }}
    >
      <div
        className="panel"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "36px",
          textAlign: "center",
          background: "rgba(17, 23, 41, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(155, 140, 255, 0.2)",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: status === "error" ? "rgba(255, 107, 107, 0.15)" : "rgba(155, 140, 255, 0.15)",
            color: status === "error" ? "#ff6b6b" : "#9b8cff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          {status === "error" ? (
            <AlertCircle size={28} />
          ) : status === "success" ? (
            <CheckCircle2 size={28} />
          ) : (
            <Sparkles size={28} />
          )}
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px", color: "#f3f5fb" }}>
          {status === "loading"
            ? "Verifying Invitation..."
            : status === "success"
            ? "Invitation Accepted!"
            : "Invitation Issue"}
        </h1>

        <p style={{ fontSize: "13px", color: "#9ca5bd", lineHeight: 1.5, margin: "0 0 24px" }}>
          {!user
            ? "Please sign in or create an account to accept this project invitation."
            : message || "Connecting you to the workspace..."}
        </p>

        {!user && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              to={`/login?returnUrl=/invite?token=${token}`}
              className="button-primary"
              style={{ justifyContent: "center", padding: "12px" }}
            >
              Sign In to Accept
            </Link>
            <Link
              to={`/register?returnUrl=/invite?token=${token}`}
              className="button-secondary"
              style={{ justifyContent: "center", padding: "12px" }}
            >
              Create Free Account
            </Link>
          </div>
        )}

        {user && status === "success" && (
          <button
            className="button-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Project Dashboard <ArrowRight size={16} />
          </button>
        )}

        {user && status === "error" && (
          <Link
            to="/dashboard"
            className="button-secondary"
            style={{ display: "block", textAlign: "center", padding: "12px" }}
          >
            Return to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
