import React, { useState, useEffect } from "react";
import { X, Plus, Sparkles, AlertCircle } from "lucide-react";
import { tasksAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function TaskModal({ isOpen, onClose, onTaskCreated, existingTasks = [], milestones = [] }) {
  const { activeProject } = useProject();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [deadline, setDeadline] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const members = activeProject?.members || [];

  useEffect(() => {
    if (members.length > 0 && !assigneeId) {
      setAssigneeId(members[0].userId?._id || members[0].userId);
    }
  }, [members, assigneeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || undefined,
        milestoneId: milestoneId || undefined,
        priority,
        estimatedHours: Number(estimatedHours) || 4,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        dependencies: selectedDependencies,
        tags,
      };

      const res = await tasksAPI.createTask(activeProject._id, payload);
      if (res.data.success) {
        onTaskCreated?.(res.data.task);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDependency = (tId) => {
    setSelectedDependencies((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    );
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="task-modal" onSubmit={handleSubmit} style={{ width: "min(100%, 540px)" }}>
        <div className="modal-head">
          <div>
            <span className="modal-kicker">TEAMPULSE AI</span>
            <h2>Create a Task</h2>
            <p>Add a task with finish-to-start dependencies and effort estimation.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={19} />
          </button>
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
              marginBottom: "14px",
            }}
          >
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <label className="form-label">
          Task Title *
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement DAG cycle detection"
            required
          />
        </label>

        <label className="form-label">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, acceptance criteria, or technical details..."
            rows={2}
            style={{
              width: "100%",
              background: "#0e1425",
              border: "1px solid #303951",
              borderRadius: "8px",
              color: "#e8ebf5",
              padding: "10px",
              fontSize: "12px",
              resize: "vertical",
            }}
          />
        </label>

        <div className="form-row">
          <label className="form-label">
            Assignee
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => {
                const u = m.userId;
                return (
                  <option key={u?._id || u} value={u?._id || u}>
                    {u?.name || "Member"} ({m.role})
                  </option>
                );
              })}
            </select>
          </label>

          <label className="form-label">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            Milestone
            <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
              <option value="">None (Standalone)</option>
              {milestones.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Estimated Effort (Hours)
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            Target Deadline
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>

          <label className="form-label">
            Tags (comma separated)
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Backend, API, Urgent"
            />
          </label>
        </div>

        {/* Finish-to-Start Predecessor Dependencies Selector */}
        {existingTasks.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ marginBottom: "6px" }}>
              Predecessor Dependencies (Tasks that must finish first)
            </label>
            <div
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                background: "#0e1425",
                border: "1px solid #303951",
                borderRadius: "8px",
                padding: "6px",
              }}
            >
              {existingTasks.map((t) => (
                <label
                  key={t._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 6px",
                    fontSize: "11px",
                    color: "#aab4cc",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDependencies.includes(t._id)}
                    onChange={() => toggleDependency(t._id)}
                  />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: "9px", color: "#72dcb5" }}>({t.status})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="modal-note">
          <Sparkles size={16} /> Workload utilization and critical-path will automatically recalculate.
        </div>

        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={loading}>
            <Plus size={16} /> {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
