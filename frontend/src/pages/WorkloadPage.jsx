import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { workloadAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function WorkloadPage() {
  const { activeProject } = useProject();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [applyingId, setApplyingId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadWorkload = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const res = await workloadAPI.getWorkload(activeProject._id);
      if (res.data.success) {
        setData(res.data.workload);
      }
    } catch (err) {
      console.error("Failed to load workload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkload();
  }, [activeProject?._id]);

  const handleApplyRecommendation = async (rec) => {
    setApplyingId(rec.id);
    try {
      const res = await workloadAPI.reassign(activeProject._id, {
        taskId: rec.task_id,
        proposedAssigneeId: rec.proposed_assignee_id,
        reason: rec.reason,
      });

      if (res.data.success) {
        showToast(res.data.message || "Task reassigned successfully!");
        loadWorkload();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to rebalance task.");
    } finally {
      setApplyingId(null);
    }
  };

  const members = data?.members_metrics || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> CAPACITY INTELLIGENCE
          </div>
          <h1>Team Workload Analysis & Balancing</h1>
          <p>
            Capacity utilization, burnout warnings, and AI advisory task redistribution recommendations.
          </p>
        </div>
      </div>

      {/* Summary Banner */}
      <div
        style={{
          background: "#12182b",
          border: "1px solid #232d47",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ fontSize: "10px", color: "#818ba5", textTransform: "uppercase", fontWeight: 700 }}>
            TEAM UTILIZATION INDEX
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <strong style={{ fontSize: "24px", color: "#e8ebf5" }}>
              {data?.team_average_utilization_pct || 0}%
            </strong>
            <span style={{ fontSize: "11px", color: "#9aa4bc" }}>
              {data?.team_total_assigned_hours || 0}h assigned / {data?.team_total_capacity_hours || 0}h capacity
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ padding: "8px 14px", background: "#171e32", borderRadius: "8px" }}>
            <span style={{ fontSize: "9px", color: "#ff8c9c", display: "block" }}>OVERLOADED</span>
            <strong style={{ fontSize: "16px" }}>
              {members.filter((m) => m.is_overloaded).length} Member(s)
            </strong>
          </div>
          <div style={{ padding: "8px 14px", background: "#171e32", borderRadius: "8px" }}>
            <span style={{ fontSize: "9px", color: "#72dcb5", display: "block" }}>OPTIMAL</span>
            <strong style={{ fontSize: "16px" }}>
              {members.filter((m) => !m.is_overloaded && !m.is_underutilized).length} Member(s)
            </strong>
          </div>
          <div style={{ padding: "8px 14px", background: "#171e32", borderRadius: "8px" }}>
            <span style={{ fontSize: "9px", color: "#ffbd7c", display: "block" }}>HEADROOM</span>
            <strong style={{ fontSize: "16px" }}>
              {members.filter((m) => m.is_underutilized).length} Member(s)
            </strong>
          </div>
        </div>
      </div>

      {/* Advisory Redistribution Recommendations Section */}
      <div
        className="panel"
        style={{
          marginBottom: "24px",
          background: "linear-gradient(110deg, #1f1b36, #12182b)",
          border: "1px solid #3c325c",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="#b6a9ff" />
            <h2 style={{ fontSize: "14px", margin: 0 }}>AI Advisory Task Redistribution Recommendations</h2>
          </div>
          <span style={{ fontSize: "10px", color: "#b9afff", background: "#372d56", padding: "3px 8px", borderRadius: "6px" }}>
            Human Approval Required
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "#9ca5bd", marginBottom: "16px", lineHeight: "1.5" }}>
          The intelligence engine analyzes member capacity, task tags, priority urgency, and dependency chains to suggest
          fair reallocations. <strong>Recommendations are advisory; no tasks are reassigned without explicit user authorization.</strong>
        </p>

        {recommendations.length === 0 ? (
          <div style={{ color: "#72dcb5", fontSize: "11px", padding: "14px", background: "#122023", borderRadius: "8px" }}>
            <CheckCircle2 size={15} style={{ display: "inline", marginRight: "6px" }} />
            Workload is currently balanced across the team. No urgent rebalancing required.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: "#161b2e",
                  border: "1px solid #2d3652",
                  borderRadius: "10px",
                  padding: "14px",
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
                        padding: "2px 6px",
                        background: rec.priority_level === "High" ? "#4a293b" : "#3b3428",
                        color: rec.priority_level === "High" ? "#ff8c9c" : "#ffbd7c",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {rec.priority_level} Priority
                    </span>
                    <strong style={{ fontSize: "12px", color: "#e8ebf5" }}>{rec.task_title}</strong>
                    <span style={{ fontSize: "10px", color: "#9b8cff" }}>({rec.estimated_remaining_hours}h)</span>
                  </div>

                  <p style={{ fontSize: "11px", color: "#aab4cc", margin: "6px 0 8px" }}>{rec.reason}</p>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "10px" }}>
                    <span style={{ color: "#ff9ca9" }}>
                      From: <strong>{rec.current_assignee_name}</strong> ({rec.current_assignee_utilization_before}% ➔{" "}
                      {rec.current_assignee_utilization_after}%)
                    </span>
                    <ArrowRight size={13} color="#818ba5" />
                    <span style={{ color: "#72dcb5" }}>
                      To: <strong>{rec.proposed_assignee_name}</strong> ({rec.proposed_assignee_utilization_before}% ➔{" "}
                      {rec.proposed_assignee_utilization_after}%)
                    </span>
                  </div>
                </div>

                <button
                  className="button-primary"
                  onClick={() => handleApplyRecommendation(rec)}
                  disabled={applyingId === rec.id}
                  style={{ height: "34px", fontSize: "11px" }}
                >
                  <Check size={14} /> {applyingId === rec.id ? "Applying..." : "Approve & Reassign"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Capacity Grid Cards */}
      <h2 style={{ fontSize: "14px", marginBottom: "14px" }}>Member Workload & Utilization Breakdown</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {members.map((m) => {
          const isOver = m.is_overloaded;
          const isUnder = m.is_underutilized;
          const statusColor = isOver ? "#ff8c9c" : isUnder ? "#ffbd7c" : "#72dcb5";
          const barColor = isOver ? "#ff8c9c" : isUnder ? "#ffbd7c" : "#9b8cff";

          return (
            <div
              key={m.user_id}
              className="panel"
              style={{
                border: isOver ? "1px solid #5a2e3e" : "1px solid #20283b",
                background: "#111729",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#e8ebf5" }}>{m.name}</strong>
                  <span style={{ fontSize: "10px", color: "#818ba5", display: "block", marginTop: "2px" }}>
                    Capacity: {m.weekly_capacity_hours}h / week
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    background: isOver ? "#432a34" : isUnder ? "#3a3026" : "#1b332b",
                    color: statusColor,
                  }}
                >
                  {m.status_label}
                </span>
              </div>

              {/* Utilization progress track */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "#818ba5" }}>Utilization:</span>
                  <strong style={{ color: statusColor }}>{m.utilization_pct}%</strong>
                </div>
                <div style={{ height: "6px", background: "#20283b", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, m.utilization_pct)}%`,
                      background: barColor,
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Metrics mini grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "10px",
                  background: "#0c1122",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <span style={{ color: "#818ba5" }}>Open Tasks:</span>
                  <strong style={{ display: "block", color: "#e8ebf5" }}>{m.open_tasks}</strong>
                </div>
                <div>
                  <span style={{ color: "#818ba5" }}>Remaining Effort:</span>
                  <strong style={{ display: "block", color: "#9b8cff" }}>{m.estimated_remaining_hours}h</strong>
                </div>
                <div>
                  <span style={{ color: "#818ba5" }}>In Progress:</span>
                  <strong style={{ display: "block", color: "#9fc5ff" }}>{m.in_progress_tasks}</strong>
                </div>
                <div>
                  <span style={{ color: "#818ba5" }}>Blocked:</span>
                  <strong style={{ display: "block", color: m.blocked_tasks > 0 ? "#ff8c9c" : "#818ba5" }}>
                    {m.blocked_tasks}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
