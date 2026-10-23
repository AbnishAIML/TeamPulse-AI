import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { reportsAPI, milestonesAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function ReportsPage() {
  const { activeProject } = useProject();
  const [summary, setSummary] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState("All");
  const [reportType, setReportType] = useState("tasks"); // "tasks" | "milestones"
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const [sumRes, milRes] = await Promise.all([
        reportsAPI.getSummary(activeProject._id, { milestoneId: selectedMilestone }),
        milestonesAPI.getMilestones(activeProject._id),
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data.report);
      }
      if (milRes.data.success) {
        setMilestones(milRes.data.milestones);
      }
    } catch (err) {
      console.error("Error loading report summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeProject?._id, selectedMilestone]);

  const handleExportCSV = () => {
    if (!activeProject?._id) return;
    const url = reportsAPI.getExportCSVUrl(activeProject._id, reportType);
    window.open(url, "_blank");
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> AUDITABLE REPORTS
          </div>
          <h1>Sprint Reports & CSV Export</h1>
          <p>Generate auditable milestone delivery, workload, and task execution reports.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export {reportType === "tasks" ? "Tasks CSV" : "Milestones CSV"}
          </button>
        </div>
      </div>

      {/* Report Type Selector & Milestone Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          padding: "14px 18px",
          background: "#111729",
          border: "1px solid #20283b",
          borderRadius: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div className="task-tabs">
          <button
            className={reportType === "tasks" ? "selected" : ""}
            onClick={() => setReportType("tasks")}
          >
            Tasks & Velocity Report
          </button>
          <button
            className={reportType === "milestones" ? "selected" : ""}
            onClick={() => setReportType("milestones")}
          >
            Milestone Delivery Report
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#818ba5" }}>Filter by Milestone:</span>
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            style={{
              background: "#151c30",
              border: "1px solid #303951",
              color: "#e8ebf5",
              borderRadius: "6px",
              padding: "5px 8px",
              fontSize: "11px",
            }}
          >
            <option value="All">All Milestones</option>
            {milestones.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <section className="stat-grid" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Tasks</span>
            <span className="stat-icon purple">
              <FileText size={18} />
            </span>
          </div>
          <div className="stat-value-row">
            <strong>{summary?.totalTasks || 0}</strong>
          </div>
          <div className="stat-note">{summary?.completedCount || 0} completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Completion Rate</span>
            <span className="stat-icon green">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="stat-value-row">
            <strong>{summary?.completionRate || 0}%</strong>
          </div>
          <div className="stat-note">Of assigned sprint scope</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Overdue Tasks</span>
            <span className="stat-icon orange">
              <Clock3 size={18} />
            </span>
          </div>
          <div className="stat-value-row">
            <strong>{summary?.overdueCount || 0}</strong>
          </div>
          <div className="stat-note">Past target deadline</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Effort Logged vs Est</span>
            <span className="stat-icon red">
              <AlertTriangle size={18} />
            </span>
          </div>
          <div className="stat-value-row">
            <strong>{summary?.totalActualHours || 0}h</strong>
          </div>
          <div className="stat-note">Against {summary?.totalEstimatedHours || 0}h estimated</div>
        </div>
      </section>

      {/* Table Data Preview */}
      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #20283b" }}>
          <h2 style={{ fontSize: "13px", margin: 0 }}>
            {reportType === "tasks" ? "Tasks & Hours Export Preview" : "Milestones Delivery Preview"}
          </h2>
          <p style={{ fontSize: "10px", color: "#818ba5", margin: "4px 0 0" }}>
            Click "Export CSV" above to download the complete raw dataset for spreadsheet analysis.
          </p>
        </div>

        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              {reportType === "tasks" ? (
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Milestone</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Est (h)</th>
                  <th>Rem (h)</th>
                  <th>Actual (h)</th>
                </tr>
              ) : (
                <tr>
                  <th>Milestone</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Completion Criteria</th>
                </tr>
              )}
            </thead>
            <tbody>
              {reportType === "tasks"
                ? summary?.tasks?.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.title}</strong>
                      </td>
                      <td>{t.assigneeId?.name || "Unassigned"}</td>
                      <td>{t.milestoneId?.title || "—"}</td>
                      <td>{t.priority}</td>
                      <td>
                        <span
                          className={`status-pill status-${t.status.toLowerCase().replaceAll(" ", "-")}`}
                        >
                          <span /> {t.status}
                        </span>
                      </td>
                      <td>{t.estimatedHours}h</td>
                      <td>{t.remainingHours}h</td>
                      <td>{t.actualHours}h</td>
                    </tr>
                  ))
                : summary?.milestones?.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <strong>{m.title}</strong>
                      </td>
                      <td>{new Date(m.dueDate).toLocaleDateString()}</td>
                      <td>{m.status}</td>
                      <td>{m.progressPct}%</td>
                      <td>{(m.completionCriteria || []).join(", ") || "—"}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
