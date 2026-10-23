import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Filter,
  Search,
  Kanban,
  List as ListIcon,
  Calendar,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Check,
  MoreHorizontal,
  Paperclip,
  GitBranch,
} from "lucide-react";
import { tasksAPI, milestonesAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import TaskModal from "../components/TaskModal.jsx";

const COLUMNS = [
  { id: "Backlog", label: "Backlog", color: "#818ca6" },
  { id: "To Do", label: "To Do", color: "#abb5cc" },
  { id: "In Progress", label: "In Progress", color: "#9fc5ff" },
  { id: "In Review", label: "In Review", color: "#d0bdff" },
  { id: "Blocked", label: "Blocked", color: "#ff9da9" },
  { id: "Done", label: "Done", color: "#72dcb5" },
];

export default function TasksPage({ onOpenCreateTask, showCreateModal, setShowCreateModal }) {
  const { activeProject } = useProject();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table" | "timeline"
  const [search, setSearch] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadTasks = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const [tasksRes, milestonesRes] = await Promise.all([
        tasksAPI.getTasks(activeProject._id),
        milestonesAPI.getMilestones(activeProject._id),
      ]);

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }
      if (milestonesRes.data.success) {
        setMilestones(milestonesRes.data.milestones);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeProject?._id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        search === "" ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.assigneeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesMilestone =
        selectedMilestone === "All" ||
        (t.milestoneId && (t.milestoneId._id === selectedMilestone || t.milestoneId === selectedMilestone));

      const matchesPriority = selectedPriority === "All" || t.priority === selectedPriority;

      return matchesSearch && matchesMilestone && matchesPriority;
    });
  }, [tasks, search, selectedMilestone, selectedPriority]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await tasksAPI.updateStatus(taskId, newStatus);
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
        showToast(`Moved to ${newStatus}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid state transition");
    }
  };

  return (
    <div className="page-wrap">
      {/* Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> SPRINT WORKSPACE
          </div>
          <h1>Task Board & Work Management</h1>
          <p>Manage sprint backlog, track dependencies, and inspect blocker issues.</p>
        </div>
        <div className="heading-actions">
          <div className="task-tabs" style={{ background: "#111729", border: "1px solid #252d42", padding: "4px" }}>
            <button
              className={viewMode === "kanban" ? "selected" : ""}
              onClick={() => setViewMode("kanban")}
            >
              <Kanban size={13} style={{ marginRight: "4px" }} /> Kanban
            </button>
            <button
              className={viewMode === "table" ? "selected" : ""}
              onClick={() => setViewMode("table")}
            >
              <ListIcon size={13} style={{ marginRight: "4px" }} /> Table
            </button>
            <button
              className={viewMode === "timeline" ? "selected" : ""}
              onClick={() => setViewMode("timeline")}
            >
              <Calendar size={13} style={{ marginRight: "4px" }} /> Timeline
            </button>
          </div>
          <button className="button-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          background: "#111729",
          border: "1px solid #20283b",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#818ba5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, tag, or assignee..."
            style={{
              background: "transparent",
              border: 0,
              outline: "none",
              color: "#e8ebf5",
              fontSize: "12px",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#818ba5" }}>Milestone:</span>
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#818ba5" }}>Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              background: "#151c30",
              border: "1px solid #303951",
              color: "#e8ebf5",
              borderRadius: "6px",
              padding: "5px 8px",
              fontSize: "11px",
            }}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(240px, 1fr))",
            gap: "14px",
            overflowX: "auto",
            paddingBottom: "20px",
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: "#0d1324",
                  border: "1px solid #20283b",
                  borderRadius: "12px",
                  padding: "14px",
                  minHeight: "520px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #20283b",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: col.color,
                      }}
                    />
                    <strong style={{ fontSize: "12px", color: "#dce1f0" }}>{col.label}</strong>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      background: "#171e32",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#818ba5",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column task cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {colTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTaskId(task._id)}
                      style={{
                        background: "#131a2c",
                        border:
                          task.blocker?.isBlocked
                            ? "1px solid #733146"
                            : "1px solid #252d42",
                        borderRadius: "9px",
                        padding: "12px",
                        cursor: "pointer",
                        transition: "0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9b8cff")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = task.blocker?.isBlocked ? "#733146" : "#252d42")
                      }
                    >
                      {/* Priority and blocker alert */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className={`priority priority-${task.priority.toLowerCase()}`}
                          style={{ fontSize: "8px" }}
                        >
                          <i /> {task.priority}
                        </span>
                        {task.blocker?.isBlocked && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              color: "#ff9da9",
                              fontSize: "9px",
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle size={11} /> BLOCKED
                          </span>
                        )}
                      </div>

                      <strong
                        style={{
                          fontSize: "11px",
                          color: "#e8ebf5",
                          display: "block",
                          marginBottom: "6px",
                          lineHeight: "1.4",
                        }}
                      >
                        {task.title}
                      </strong>

                      {/* Milestone badge */}
                      {task.milestoneId?.title && (
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#9b8cff",
                            background: "#221d3b",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            display: "inline-block",
                            marginBottom: "8px",
                          }}
                        >
                          {task.milestoneId.title}
                        </div>
                      )}

                      {/* Dependencies and Assignee footer */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid #1c2438",
                          fontSize: "10px",
                          color: "#818ba5",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            className={`avatar avatar-${task.assigneeId?.avatarColor || "blue"} avatar-small`}
                          >
                            {task.assigneeId?.initials || "UN"}
                          </span>
                          <span style={{ fontSize: "10px", color: "#c6beff" }}>
                            {task.assigneeId?.name?.split(" ")[0] || "Unassigned"}
                          </span>
                        </div>
                        <span>{task.estimatedHours || 0}h</span>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#5b657e",
                        fontSize: "10px",
                        border: "1px dashed #20283b",
                        borderRadius: "8px",
                      }}
                    >
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="task-table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Milestone</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Effort</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <div className="task-name-cell">
                        <button
                          className={`task-check ${task.status === "Done" ? "checked" : ""}`}
                          onClick={() => handleStatusChange(task._id, task.status === "Done" ? "In Progress" : "Done")}
                        >
                          {task.status === "Done" && <Check size={12} />}
                        </button>
                        <div>
                          <strong
                            onClick={() => setSelectedTaskId(task._id)}
                            style={{ cursor: "pointer" }}
                          >
                            {task.title}
                          </strong>
                          {task.dependencies?.length > 0 && (
                            <small style={{ color: "#9b8cff" }}>
                              <GitBranch size={10} style={{ display: "inline", marginRight: "3px" }} />
                              {task.dependencies.length} predecessor(s)
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="assignee-cell">
                        <span
                          className={`avatar avatar-${task.assigneeId?.avatarColor || "blue"} avatar-small`}
                        >
                          {task.assigneeId?.initials || "UN"}
                        </span>
                        <span>{task.assigneeId?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td>{task.milestoneId?.title || "—"}</td>
                    <td>
                      <span className={`priority priority-${task.priority.toLowerCase()}`}>
                        <i /> {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                        <span /> {task.status}
                      </span>
                    </td>
                    <td className="due-date">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"}
                    </td>
                    <td>{task.remainingHours || task.estimatedHours}h</td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => setSelectedTaskId(task._id)}
                        title="View details"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: TIMELINE / GANTT VIEW */}
      {viewMode === "timeline" && (
        <div className="panel" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "14px", marginBottom: "8px" }}>Sprint Timeline & Schedule Duration</h2>
          <p style={{ fontSize: "11px", color: "#808ba5", marginBottom: "20px" }}>
            Visual duration of tasks and finish-to-start predecessor sequence.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredTasks.map((t, idx) => {
              const startOffset = (idx % 5) * 15;
              const durationWidth = Math.max(20, Math.min(60, (t.estimatedHours || 4) * 8));
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTaskId(t._id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px 1fr",
                    alignItems: "center",
                    gap: "14px",
                    padding: "8px 0",
                    borderBottom: "1px solid #1f273d",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#dce1f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{t.title}</strong>
                    <div style={{ fontSize: "9px", color: "#818ba5" }}>
                      {t.assigneeId?.name || "Unassigned"} · {t.estimatedHours || 4}h
                    </div>
                  </div>
                  <div style={{ position: "relative", height: "24px", background: "#0e1425", borderRadius: "6px" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: `${startOffset}%`,
                        width: `${durationWidth}%`,
                        height: "100%",
                        background:
                          t.status === "Done"
                            ? "#1c4038"
                            : t.status === "Blocked"
                              ? "#4a293b"
                              : "#2f2752",
                        border: `1px solid ${t.status === "Done"
                            ? "#72dcb5"
                            : t.status === "Blocked"
                              ? "#ff8c9c"
                              : "#9b8cff"
                          }`,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 8px",
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "#fff",
                      }}
                    >
                      {t.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={Boolean(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => loadTasks()}
        />
      )}

      {showCreateModal && (
        <TaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={() => {
            loadTasks();
            showToast("Task created successfully!");
          }}
          existingTasks={tasks}
          milestones={milestones}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
