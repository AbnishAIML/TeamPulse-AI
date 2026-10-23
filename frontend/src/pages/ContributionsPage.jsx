import React, { useState, useEffect } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";
import { getSocket } from "../services/socket.js";

export default function ContributionsPage() {
  const { activeProject } = useProject();
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const [contribRes, actRes] = await Promise.all([
        analyticsAPI.getContributions(activeProject._id),
        analyticsAPI.getActivity(activeProject._id, 30),
      ]);

      if (contribRes.data.success) {
        setData(contribRes.data.contributions);
      }
      if (actRes.data.success) {
        setActivities(actRes.data.activities);
      }
    } catch (err) {
      console.error("Failed to load contribution data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    if (!socket || !activeProject?._id) return;

    let refreshTimeout = null;
    const debouncedReload = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        loadData();
      }, 500);
    };

    const handleNewActivity = (act) => {
      setActivities((prev) => [act, ...prev.filter((a) => a._id !== act._id)]);
      debouncedReload();
    };

    socket.on("activity:new", handleNewActivity);
    socket.on("task:status_changed", debouncedReload);
    socket.on("task:created", debouncedReload);
    socket.on("task:updated", debouncedReload);

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      socket.off("activity:new", handleNewActivity);
      socket.off("task:status_changed", debouncedReload);
      socket.off("task:created", debouncedReload);
      socket.off("task:updated", debouncedReload);
    };
  }, [activeProject?._id]);

  const indicators = data?.team_indicators || [];

  // Format data for Recharts multi-bar comparison (only include members with sufficient data)
  const chartData = indicators
    .filter((ind) => ind.has_sufficient_data !== false)
    .map((ind) => ({
      name: ind.name.split(" ")[0],
      Completion: ind.task_completion_score,
      Timeliness: ind.timeliness_score,
      Review: ind.collaboration_review_score,
      ProblemSolving: ind.problem_solving_score,
      Estimation: ind.effort_accuracy_score,
    }));

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> MULTI-SIGNAL ANALYSIS
          </div>
          <h1>Team Contribution & Activity Analysis</h1>
          <p>
            Equitable, multi-dimensional team evaluation based on delivery commitments, peer reviews, and problem-solving.
          </p>
        </div>
      </div>

      {/* Fairness & Transparency Disclaimer Banner */}
      <div
        style={{
          background: "#161b2e",
          border: "1px solid #2e3752",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
        }}
      >
        <Info size={22} color="#9b8cff" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong style={{ fontSize: "13px", color: "#e8ebf5" }}>Fair Contribution Methodology Statement</strong>
          <p style={{ fontSize: "11px", color: "#9ca5bd", margin: "4px 0 0", lineHeight: "1.5" }}>
            {data?.methodology_statement ||
              "TeamPulse AI evaluates 5 holistic dimensions: Deliverable Completion, Timeliness, Peer Review Collaboration, Problem Solving, and Estimation Precision. We explicitly avoid simplistic task counts or raw hours logged to prevent distorting productivity."}
          </p>
        </div>
      </div>

      {/* Multi-Dimensional Comparison Chart Panel */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", marginBottom: "4px" }}>Cross-Dimensional Team Contribution Matrix</h2>
        <p style={{ fontSize: "10px", color: "#818ba5", marginBottom: "16px" }}>
          Scores across Completion, Timeliness, Code Review, Problem Solving, and Estimation Precision (0 - 100)
        </p>

        <div style={{ height: "260px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#242b3d" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#151c30",
                  border: "1px solid #303951",
                  borderRadius: 10,
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#818ba5" }} />
              <Bar dataKey="Completion" name="Completion Rate" fill="#9b8cff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Timeliness" name="On-Time Delivery" fill="#72dcb5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Review" name="Peer Reviews" fill="#4ca8ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ProblemSolving" name="Problem Solving" fill="#ffbd7c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Estimation" name="Estimate Accuracy" fill="#d0bdff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Contribution Breakdown Cards */}
      <h2 style={{ fontSize: "14px", marginBottom: "14px" }}>Individual Contribution Indicators</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginBottom: "30px" }}>
        {indicators.map((ind) => (
          <div key={ind.user_id} className="panel" style={{ background: "#111729", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <strong style={{ fontSize: "14px", color: "#e8ebf5" }}>{ind.name}</strong>
              <div style={{ textAlign: "right" }}>
                {ind.has_sufficient_data === false ? (
                  <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, padding: "2px 7px", background: "#2b2212", borderRadius: "4px", border: "1px solid #593d18" }}>
                    Pending Data
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#9b8cff" }}>
                      {ind.composite_contribution_index}
                    </span>
                    <span style={{ fontSize: "10px", color: "#818ba5" }}> / 100</span>
                  </>
                )}
              </div>
            </div>

            {ind.has_sufficient_data === false ? (
              <div style={{ padding: "12px", background: "#182033", borderRadius: "8px", border: "1px dashed #323d5b", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                  <AlertTriangle size={14} /> Insufficient Work Recorded
                </div>
                <p style={{ fontSize: "10px", color: "#9ca5bd", margin: 0, lineHeight: "1.4" }}>
                  {ind.insufficient_data_reason || "Recently onboarded member with initial scoped work. A score will be calculated once completed deliverables or peer review contributions are recorded."}
                </p>
              </div>
            ) : (
              /* Indicator Mini Bars */
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: "#818ba5" }}>Completion Velocity</span>
                    <strong style={{ color: "#e8ebf5" }}>{ind.task_completion_score}%</strong>
                  </div>
                  <div style={{ height: "4px", background: "#20283b", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ind.task_completion_score}%`, background: "#9b8cff" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: "#818ba5" }}>On-Time Commitments</span>
                    <strong style={{ color: "#e8ebf5" }}>{ind.timeliness_score}%</strong>
                  </div>
                  <div style={{ height: "4px", background: "#20283b", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ind.timeliness_score}%`, background: "#72dcb5" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: "#818ba5" }}>Peer Review Stewardship</span>
                    <strong style={{ color: "#e8ebf5" }}>{ind.collaboration_review_score}%</strong>
                  </div>
                  <div style={{ height: "4px", background: "#20283b", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ind.collaboration_review_score}%`, background: "#4ca8ff" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: "#818ba5" }}>Problem Solving & Unblocking</span>
                    <strong style={{ color: "#e8ebf5" }}>{ind.problem_solving_score}%</strong>
                  </div>
                  <div style={{ height: "4px", background: "#20283b", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ind.problem_solving_score}%`, background: "#ffbd7c" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Key Strengths */}
            <div>
              <span style={{ fontSize: "9px", color: "#818ba5", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Observed Team Strengths
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {ind.key_strengths.map((str, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "9px",
                      padding: "3px 7px",
                      borderRadius: "4px",
                      background: "#1c253d",
                      color: "#b6a9ff",
                      border: "1px solid #28334e",
                    }}
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Audit Activity Feed */}
      <div className="panel" style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "14px", marginBottom: "4px" }}>Project Chronological Audit Activity Feed</h2>
        <p style={{ fontSize: "10px", color: "#818ba5", marginBottom: "16px" }}>
          Immutable ledger of task creations, blocker reports, code reviews, and completions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activities.map((act) => (
            <div
              key={act._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#0e1425",
                borderRadius: "8px",
                border: "1px solid #20283b",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: act.eventType.includes("COMPLETED")
                      ? "#72dcb5"
                      : act.eventType.includes("BLOCKER")
                      ? "#ff8c9c"
                      : "#9b8cff",
                  }}
                />
                <span style={{ color: "#dce1f0" }}>{act.summary}</span>
              </div>
              <span style={{ fontSize: "10px", color: "#818ba5" }}>
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#818ba5", fontSize: "11px" }}>
              No recorded activity yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
