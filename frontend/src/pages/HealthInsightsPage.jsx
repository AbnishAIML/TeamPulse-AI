import React, { useState, useEffect } from "react";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { analyticsAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function HealthInsightsPage({ setActiveNav }) {
  const { activeProject } = useProject();
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      if (!activeProject?._id) return;
      setLoading(true);
      try {
        const res = await analyticsAPI.getHealth(activeProject._id);
        if (res.data.success) {
          setHealth(res.data.health);
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        console.error("Failed to load health insights:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
  }, [activeProject?._id]);

  const score = health?.health_score || 72;
  const risk = health?.risk_level || "At Risk";
  const factors = health?.factors || [];
  const recommendations = health?.recommendations || [];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> PREDICTIVE INTELLIGENCE
          </div>
          <h1>AI Project Health & Risk Evaluation</h1>
          <p>
            Composite risk assessment derived from milestone variances, critical path delays, blockers, and capacity deficits.
          </p>
        </div>
      </div>

      {/* Main Health Card */}
      <div
        className="panel"
        style={{
          background: "linear-gradient(130deg, #1b1633, #111729)",
          border: "1px solid #3c2f5d",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div
            className="health-ring"
            style={{
              width: "120px",
              height: "120px",
              background: `conic-gradient(#9b8cff 0 ${score}%, #283049 ${score}% 100%)`,
            }}
          >
            <div>
              <strong style={{ fontSize: "32px" }}>{score}</strong>
              <span style={{ fontSize: "10px", color: "#8993ad" }}>/ 100</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="risk-label" style={{ fontSize: "10px", padding: "4px 8px" }}>
                <i /> {risk.toUpperCase()}
              </span>
              <span style={{ fontSize: "11px", color: "#818ba5" }}>
                Derived from {factors.length} weighted risk dimensions
              </span>
            </div>
            <h2 style={{ fontSize: "16px", color: "#e8ebf5", margin: "8px 0 6px" }}>
              {health?.summary || "Project requires active mitigation."}
            </h2>
            <p style={{ fontSize: "11px", color: "#9ca5bd", margin: 0, lineHeight: "1.5" }}>
              Schedule float and critical path tasks indicate that immediate unblocking of upstream deliverables is required
              to guarantee target milestone dates.
            </p>
          </div>
        </div>
      </div>

      {/* Contributing Factors Breakdown */}
      <h2 style={{ fontSize: "14px", marginBottom: "14px" }}>Contributing Risk Dimensions & Weightings</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {factors.map((f, idx) => {
          const isGood = f.score >= 80;
          const isWarn = f.score >= 50 && f.score < 80;
          const color = isGood ? "#72dcb5" : isWarn ? "#ffbd7c" : "#ff8c9c";
          const bg = isGood ? "#1c3830" : isWarn ? "#3b2f24" : "#4a2432";

          return (
            <div key={idx} className="panel" style={{ background: "#111729", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "12px", color: "#e8ebf5" }}>{f.name}</strong>
                <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: bg, color }}>
                  {f.impact}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                <span style={{ color: "#818ba5" }}>Score:</span>
                <strong style={{ color }}>{f.score} / 100</strong>
              </div>
              <div style={{ height: "4px", background: "#20283b", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${f.score}%`, background: color }} />
              </div>
              <p style={{ fontSize: "10px", color: "#818ba5", margin: 0, lineHeight: "1.4" }}>{f.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Actionable Recommendations List */}
      <h2 style={{ fontSize: "14px", marginBottom: "14px" }}>Prioritized Actionable Next Steps</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="panel"
            style={{
              background: "#12182b",
              border: "1px solid #28334e",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "280px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: rec.priority === "High" ? "#4a2432" : "#3b3024",
                    color: rec.priority === "High" ? "#ff8c9c" : "#ffbd7c",
                  }}
                >
                  {rec.priority} Priority
                </span>
                <span style={{ fontSize: "10px", color: "#9b8cff", fontWeight: 600 }}>{rec.category}</span>
                <strong style={{ fontSize: "13px", color: "#e8ebf5" }}>{rec.title}</strong>
              </div>
              <p style={{ fontSize: "11px", color: "#cbd5e1", margin: "6px 0 4px", lineHeight: "1.4" }}>
                {rec.description}
              </p>
              <div style={{ fontSize: "10px", color: "#818ba5" }}>
                <strong>Suggested Action:</strong> {rec.suggested_action} · <em>Impact: {rec.impact_statement}</em>
              </div>
            </div>

            <button
              className="button-secondary"
              onClick={() => {
                if (rec.category === "Dependency") setActiveNav("Dependencies");
                else if (rec.category === "Workload") setActiveNav("Team workload");
                else setActiveNav("Task board");
              }}
              style={{ height: "34px", fontSize: "11px" }}
            >
              Resolve in {rec.category} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
