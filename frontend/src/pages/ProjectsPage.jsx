import React, { useState } from "react";
import { FolderKanban, Plus, Calendar, CheckCircle2, ListTodo, X } from "lucide-react";
import { useProject } from "../context/ProjectContext.jsx";
import { projectsAPI } from "../services/api.js";

export default function ProjectsPage({ showCreateModal, setShowCreateModal }) {
  const { projects, activeProject, selectProject, fetchProjects } = useProject();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetDeadline) return;

    setLoading(true);
    try {
      const res = await projectsAPI.createProject({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim(),
        targetDeadline,
      });

      if (res.data.success) {
        showToast("Project created successfully!");
        setShowCreateModal(false);
        setName("");
        setCode("");
        setDescription("");
        setTargetDeadline("");
        await fetchProjects();
        selectProject(res.data.project);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> WORKSPACE PORTFOLIO
          </div>
          <h1>Projects Directory</h1>
          <p>Manage software initiatives, objectives, and team rosters.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
        {projects.map((p) => {
          const isActive = p._id === activeProject?._id;
          return (
            <div
              key={p._id}
              className="panel"
              style={{
                display: "flex",
                flexDirection: "column",
                background: isActive ? "#151b2e" : "#111729",
                border: isActive ? "1px solid #4a3e75" : "1px solid #20283b",
                padding: "20px",
                cursor: "pointer",
              }}
              onClick={() => selectProject(p)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "9px", color: "#9b8cff", fontWeight: 700, letterSpacing: "1px" }}>
                    {p.code}
                  </span>
                  <strong style={{ fontSize: "15px", color: "#e8ebf5", display: "block", marginTop: "2px" }}>
                    {p.name}
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: isActive ? "#292444" : "#1a2133",
                    color: isActive ? "#c6beff" : "#818ba5",
                    fontWeight: 700,
                  }}
                >
                  {isActive ? "ACTIVE WORKSPACE" : p.status}
                </span>
              </div>

              {p.description && (
                <p style={{ fontSize: "11px", color: "#9ca5bd", margin: "0 0 16px", lineHeight: "1.4" }}>
                  {p.description}
                </p>
              )}

              {/* Progress track */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
                  <span style={{ color: "#818ba5" }}>
                    Progress ({p.completedTasks || 0}/{p.totalTasks || 0} tasks)
                  </span>
                  <strong style={{ color: "#9b8cff" }}>{p.completionRate || 0}%</strong>
                </div>
                <div style={{ height: "5px", background: "#20283b", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${p.completionRate || 0}%`,
                      background: "#9b8cff",
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>

              {/* Footer info: Members & Target Deadline */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "auto",
                  paddingTop: "12px",
                  borderTop: "1px solid #1c2438",
                  fontSize: "10px",
                  color: "#818ba5",
                }}
              >
                <span>{p.members?.length || 1} team member(s)</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={11} /> Deadline: {new Date(p.targetDeadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <form className="task-modal" onSubmit={handleCreateProject}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">INITIATIVE</span>
                <h2>Create New Project</h2>
                <p>Set up objectives and target delivery milestone.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="form-label">
              Project Name *
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Campus Smart Attendance AI"
                required
              />
            </label>

            <div className="form-row">
              <label className="form-label">
                Project Code (Short)
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSA"
                  maxLength={6}
                />
              </label>

              <label className="form-label">
                Target Deadline *
                <input
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="form-label">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project goals and deliverables..."
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
              <button type="button" className="button-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="button-primary" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
