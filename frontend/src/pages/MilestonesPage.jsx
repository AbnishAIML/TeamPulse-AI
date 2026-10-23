import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  X,
  Trash2,
  Edit,
} from "lucide-react";
import { milestonesAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function MilestonesPage() {
  const { activeProject } = useProject();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [criteriaInput, setCriteriaInput] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadMilestones = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const res = await milestonesAPI.getMilestones(activeProject._id);
      if (res.data.success) {
        setMilestones(res.data.milestones);
      }
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, [activeProject?._id]);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      const criteria = criteriaInput
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await milestonesAPI.createMilestone(activeProject._id, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        completionCriteria: criteria,
      });

      if (res.data.success) {
        showToast("Milestone created successfully!");
        setShowModal(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        setCriteriaInput("");
        loadMilestones();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create milestone.");
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm("Are you sure you want to delete this milestone? Associated tasks will be disassociated.")) return;
    try {
      const res = await milestonesAPI.deleteMilestone(id);
      if (res.data.success) {
        showToast("Milestone deleted.");
        loadMilestones();
      }
    } catch (err) {
      showToast("Failed to delete milestone.");
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> SPRINT DELIVERY TARGETS
          </div>
          <h1>Milestone Management & Progress</h1>
          <p>Track delivery gates, acceptance criteria, and automatic progress rollups.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Milestone
          </button>
        </div>
      </div>

      {/* Milestones Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
        {milestones.map((m) => {
          const isDone = m.status === "Completed";
          const isOverdue = m.isOverdue || m.status === "Overdue";
          const badgeBg = isDone ? "#1c4038" : isOverdue ? "#432a34" : "#223651";
          const badgeColor = isDone ? "#72dcb5" : isOverdue ? "#ff9ca9" : "#9fc5ff";

          return (
            <div
              key={m._id}
              className="panel"
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#111729",
                border: isOverdue ? "1px solid #5a2e3e" : "1px solid #20283b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#e8ebf5", display: "block" }}>{m.title}</strong>
                  <span style={{ fontSize: "10px", color: "#818ba5", display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
                    <Calendar size={12} /> Due: {new Date(m.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: badgeBg,
                    color: badgeColor,
                  }}
                >
                  {isOverdue ? "OVERDUE" : m.status.toUpperCase()}
                </span>
              </div>

              {m.description && (
                <p style={{ fontSize: "11px", color: "#9ca5bd", margin: "0 0 14px", lineHeight: "1.4" }}>
                  {m.description}
                </p>
              )}

              {/* Progress bar */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
                  <span style={{ color: "#818ba5" }}>
                    Progress ({m.completedTasks || 0}/{m.totalTasks || 0} tasks done)
                  </span>
                  <strong style={{ color: isDone ? "#72dcb5" : "#9b8cff" }}>{m.progressPct}%</strong>
                </div>
                <div style={{ height: "6px", background: "#20283b", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${m.progressPct}%`,
                      background: isDone ? "#72dcb5" : "#9b8cff",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>

              {/* Completion criteria checklist */}
              <div style={{ flex: 1, marginBottom: "14px" }}>
                <strong style={{ fontSize: "10px", color: "#818ba5", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Completion Criteria
                </strong>
                {m.completionCriteria?.length === 0 ? (
                  <div style={{ fontSize: "10px", color: "#5b657e" }}>No specific criteria listed.</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#cbd5e1" }}>
                    {m.completionCriteria.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #1c2438",
                  paddingTop: "10px",
                }}
              >
                <button
                  className="icon-button"
                  onClick={() => handleDeleteMilestone(m._id)}
                  title="Delete milestone"
                  style={{ color: "#ff8c9c" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#808ba5" }}>
            No milestones configured for this project yet. Click "New Milestone" to add one!
          </div>
        )}
      </div>

      {/* Create Milestone Modal */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <form className="task-modal" onSubmit={handleCreateMilestone}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">SPRINT TARGET</span>
                <h2>Create Milestone</h2>
                <p>Define delivery gates and acceptance criteria.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="form-label">
              Milestone Title *
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. M3: Analytics Engine Release"
                required
              />
            </label>

            <label className="form-label">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary of deliverables..."
                rows={2}
                style={{
                  width: "100%",
                  background: "#0e1425",
                  border: "1px solid #303951",
                  borderRadius: "8px",
                  color: "#e8ebf5",
                  padding: "10px",
                  fontSize: "12px",
                }}
              />
            </label>

            <label className="form-label">
              Target Due Date *
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </label>

            <label className="form-label">
              Completion Criteria (One item per line)
              <textarea
                value={criteriaInput}
                onChange={(e) => setCriteriaInput(e.target.value)}
                placeholder="All test cases pass&#10;Peer review completed&#10;Documentation updated"
                rows={3}
                style={{
                  width: "100%",
                  background: "#0e1425",
                  border: "1px solid #303951",
                  borderRadius: "8px",
                  color: "#e8ebf5",
                  padding: "10px",
                  fontSize: "12px",
                }}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
