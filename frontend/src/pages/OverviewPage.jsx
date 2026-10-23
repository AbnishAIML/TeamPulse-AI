import React, { useState, useEffect, useMemo } from "react";
import {
  ListTodo,
  CheckCircle2,
  Clock3,
  Gauge,
  Plus,
  FileText,
  CalendarDays,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  GitBranch,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { tasksAPI, workloadAPI, analyticsAPI } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProject } from "../context/ProjectContext.jsx";
import { getSocket } from "../services/socket.js";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import TaskModal from "../components/TaskModal.jsx";

function Avatar({ initials, color = "blue", small = false }) {
  return <span className={`avatar avatar-${color} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

function StatusPill({ status }) {
  const cls = status?.toLowerCase().replaceAll(" ", "-") || "to-do";
  return (
    <span className={`status-pill status-${cls}`}>
      <span />
      {status}
    </span>
  );
}

function Priority({ value }) {
  return (
    <span className={`priority priority-${value?.toLowerCase() || "medium"}`}>
      <i />
      {value}
    </span>
  );
}

function StatCard({ label, value, change, direction, icon: Icon, tone, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-value-row">
        <strong>{value}</strong>
        {change && (
          <span className={`change ${direction}`}>
            {direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {change}
          </span>
        )}
      </div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

export default function OverviewPage({ setActiveNav, onOpenCreateTask }) {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [tasks, setTasks] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [filter, setFilter] = useState("All tasks");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadDashboardData = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const [tasksRes, workloadRes, healthRes] = await Promise.all([
        tasksAPI.getTasks(activeProject._id),
        workloadAPI.getWorkload(activeProject._id),
        analyticsAPI.getHealth(activeProject._id),
      ]);

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }

      if (workloadRes.data.success && workloadRes.data.workload) {
        const chartData = workloadRes.data.workload.members_metrics.map((m) => ({
          name: m.name.split(" ")[0],
          assigned: m.estimated_remaining_hours,
          capacity: m.weekly_capacity_hours,
        }));
        setWorkloadData(chartData);
      }

      if (healthRes.data.success) {
        setHealthData(healthRes.data.health);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const socket = getSocket();
    if (!socket || !activeProject?._id) return;

    let refreshTimeout = null;
    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        loadDashboardData();
      }, 500);
    };

    socket.on("task:created", debouncedRefresh);
    socket.on("task:updated", debouncedRefresh);
    socket.on("task:status_changed", debouncedRefresh);
    socket.on("task:deleted", debouncedRefresh);
    socket.on("workload:rebalanced", debouncedRefresh);
    socket.on("milestone:updated", debouncedRefresh);

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      socket.off("task:created", debouncedRefresh);
      socket.off("task:updated", debouncedRefresh);
      socket.off("task:status_changed", debouncedRefresh);
      socket.off("task:deleted", debouncedRefresh);
      socket.off("workload:rebalanced", debouncedRefresh);
      socket.off("milestone:updated", debouncedRefresh);
    };
  }, [activeProject?._id]);

  const filteredTasks = useMemo(() => {
    if (filter === "All tasks") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const markDone = async (id) => {
    try {
      const res = await tasksAPI.updateStatus(id, "Done");
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
        showToast("Task marked as Done!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot mark as Done (check review/blockers)");
    }
  };

  // Real 7-day velocity calculated strictly from task event timestamps
  const trendData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().slice(0, 10),
        day: days[d.getDay()],
        completed: 0,
        created: 0,
      };
    });

    tasks.forEach((t) => {
      if (t.createdAt) {
        const createdDate = new Date(t.createdAt).toISOString().slice(0, 10);
        const match = last7.find((p) => p.dateStr === createdDate);
        if (match) match.created += 1;
      }
      if (t.status === "Done" && t.completedAt) {
        const compDate = new Date(t.completedAt).toISOString().slice(0, 10);
        const match = last7.find((p) => p.dateStr === compDate);
        if (match) match.completed += 1;
      }
    });

    return last7;
  }, [tasks]);

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== "Archived" && t.status !== "Cancelled"), [tasks]);
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = activeTasks.filter((t) => t.status === "In Progress").length;
  const overdueTasks = activeTasks.filter(
    (t) => t.status !== "Done" && t.deadline && new Date(t.deadline) < new Date()
  ).length;
  const blockedTasks = activeTasks.filter((t) => t.status === "Blocked" || t.blocker?.isBlocked).length;

  // Section 2.4b: Completion Rate and Effort-Weighted Completion Rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedHours = activeTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const doneEstimatedHours = activeTasks.filter((t) => t.status === "Done").reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const effortWeightedRate = totalEstimatedHours > 0 ? Math.round((doneEstimatedHours / totalEstimatedHours) * 100) : null;

  // Real average team capacity utilization from workload metrics
  const avgUtil = useMemo(() => {
    if (!workloadData || workloadData.length === 0) return null;
    const totalCap = workloadData.reduce((acc, m) => acc + (m.capacity || 0), 0);
    const totalRem = workloadData.reduce((acc, m) => acc + (m.assigned || 0), 0);
    if (totalCap <= 0) return null;
    return Math.round((totalRem / totalCap) * 100);
  }, [workloadData]);

  const hasHealthData = healthData && healthData.factors && healthData.factors.length >= 3;
  const healthScore = hasHealthData ? healthData.health_score : null;
  const riskLevel = hasHealthData ? healthData.risk_level : "Insufficient data";

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> WORKSPACE OVERVIEW
          </div>
          <h1>Good day, {user?.name?.split(" ")[0] || "Team Member"} 👋</h1>
          <p>
            Here's what's happening across <strong>{activeProject?.name || "Active Project"}</strong> today.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button-secondary" onClick={() => setActiveNav("Reports")}>
            <FileText size={16} /> Export Reports
          </button>
          <button className="button-primary" onClick={onOpenCreateTask}>
            <Plus size={17} /> Create Task
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <section className="stat-grid">
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          change={inProgressTasks > 0 ? `${inProgressTasks} active` : undefined}
          direction="up"
          icon={ListTodo}
          tone="purple"
          note={totalTasks > 0 ? `${inProgressTasks} in progress` : "No tasks in sprint"}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          change={effortWeightedRate !== null ? `${effortWeightedRate}% effort` : undefined}
          direction="up"
          icon={CheckCircle2}
          tone="green"
          note={effortWeightedRate !== null ? `Effort-weighted: ${effortWeightedRate}%` : `${completedTasks} of ${totalTasks} completed`}
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks}
          change={overdueTasks > 0 ? "Requires Action" : undefined}
          direction="down"
          icon={Clock3}
          tone="orange"
          note={overdueTasks > 0 ? "Past deadline" : "All tasks on schedule"}
        />
        <StatCard
          label="Project Health"
          value={healthScore !== null ? `${healthScore}/100` : "—"}
          change={riskLevel}
          direction={healthScore !== null && healthScore >= 75 ? "up" : "down"}
          icon={Gauge}
          tone={healthScore !== null ? (healthScore >= 75 ? "green" : healthScore >= 50 ? "orange" : "red") : "purple"}
          note={hasHealthData ? `${blockedTasks} active blocker(s)` : "Needs 3+ factor metrics"}
        />
      </section>

      {/* Main Grid: Progress Chart & Health Ring */}
      <section className="main-grid">
        <div className="panel progress-panel">
          <div className="panel-header">
            <div>
              <h2>Project Progress</h2>
              <p>Task completion velocity across sprint</p>
            </div>
            <button className="select-button" onClick={() => showToast("Showing 7-day velocity")}>
              <CalendarDays size={15} /> Last 7 Days <ChevronDown size={14} />
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-purple" /> Completed tasks
            </span>
            <span>
              <i className="legend-blue" /> New tasks created
            </span>
          </div>
          <div className="area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b7cff" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#8b7cff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ca8ff" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#4ca8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#242b3d" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#151c30",
                    border: "1px solid #303951",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#9b8cff"
                  strokeWidth={2.5}
                  fill="url(#completedFill)"
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#4ca8ff"
                  strokeWidth={2}
                  fill="url(#createdFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            <span>
              <span className="footer-dot purple-dot" /> {completedTasks} tasks completed in this project
            </span>
            <span className="positive-text">
              <ArrowUpRight size={14} /> Active velocity
            </span>
          </div>
        </div>

        {/* Health Ring Panel */}
        <div className="panel health-panel">
          <div className="panel-header">
            <div>
              <h2>Project Health Index</h2>
              <p>Evaluated from schedule variance, blockers & capacity</p>
            </div>
            <button
              className="icon-button"
              onClick={() => setActiveNav("AI insights")}
              title="View full health details"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="health-score">
            <div
              className="health-ring"
              style={{
                background:
                  healthScore !== null
                    ? `conic-gradient(#9b8cff 0 ${healthScore}%, #2a3047 ${healthScore}% 100%)`
                    : "#2a3047",
              }}
            >
              <div>
                <strong style={{ fontSize: healthScore !== null ? "29px" : "20px" }}>
                  {healthScore !== null ? healthScore : "—"}
                </strong>
                <span>{healthScore !== null ? "/ 100" : "N/A"}</span>
              </div>
            </div>
            <div className="health-status">
              <span className="risk-label">
                <i /> {riskLevel}
              </span>
              <p>
                {hasHealthData
                  ? healthData?.summary ||
                    (blockedTasks > 0
                      ? `${blockedTasks} blocker(s) affecting downstream delivery.`
                      : "Schedule is tracking smoothly.")
                  : "Insufficient project data to evaluate risk. Add milestones and task estimates."}
              </p>
            </div>
          </div>

          <div className="health-metrics">
            <div>
              <span>Completed Scope</span>
              <strong>{totalTasks > 0 ? `${completionRate}%` : "0%"}</strong>
              <div className="mini-track">
                <i
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <span>Team Utilization</span>
              <strong>{avgUtil !== null ? `${avgUtil}%` : "Not set"}</strong>
              <div className="mini-track blue-track">
                <i style={{ width: `${Math.min(100, avgUtil || 0)}%` }} />
              </div>
            </div>
          </div>

          <button className="text-link" onClick={() => setActiveNav("AI insights")}>
            View AI Risk Analysis & Critical Path <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      {/* Bottom Grid: Recent Tasks & Workload */}
      <section className="bottom-grid">
        <div className="panel task-panel">
          <div className="panel-header task-panel-header">
            <div>
              <h2>Recent Tasks</h2>
              <p>Real-time deliverables across sprint</p>
            </div>
            <button className="text-link" onClick={() => setActiveNav("Task board")}>
              Open Task Board <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="task-toolbar">
            <div className="task-tabs">
              {["All tasks", "In Progress", "Blocked", "Done"].map((tab) => (
                <button
                  key={tab}
                  className={filter === tab ? "selected" : ""}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="task-table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.slice(0, 7).map((task) => (
                  <tr key={task._id}>
                    <td>
                      <div className="task-name-cell">
                        <button
                          className={`task-check ${task.status === "Done" ? "checked" : ""}`}
                          onClick={() => markDone(task._id)}
                          aria-label={`Mark ${task.title} done`}
                        >
                          {task.status === "Done" && <Check size={12} />}
                        </button>
                        <div>
                          <strong
                            onClick={() => setSelectedTaskId(task._id)}
                            style={{ cursor: "pointer" }}
                            title={task.title}
                          >
                            {task.title}
                          </strong>
                          <small>{activeProject?.name}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="assignee-cell">
                        <Avatar
                          initials={task.assigneeId?.initials || "UN"}
                          color={task.assigneeId?.avatarColor || "blue"}
                          small
                        />
                        <span>{task.assigneeId?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td>
                      <Priority value={task.priority} />
                    </td>
                    <td>
                      <StatusPill status={task.status} />
                    </td>
                    <td className="due-date">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "No date"}
                    </td>
                    <td>
                      <button
                        className="icon-button row-more"
                        onClick={() => setSelectedTaskId(task._id)}
                        aria-label="Task details"
                        title="View task details"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No tasks found in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workload Bar Chart Panel */}
        <div className="panel workload-panel">
          <div className="panel-header">
            <div>
              <h2>Team Workload</h2>
              <p>Assigned hours vs configured weekly capacity</p>
            </div>
            <button className="icon-button" onClick={() => setActiveNav("Team workload")} aria-label="Team workload">
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="workload-chart">
            {workloadData.length === 0 ? (
              <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#818ba5", fontSize: "11px", textAlign: "center", padding: "20px" }}>
                No team workload data available yet. Add members and assign estimated tasks to track workload.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} barGap={5} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#242b3d" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#818ba5", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#151c30",
                      border: "1px solid #303951",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="capacity" name="Capacity" fill="#303951" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="assigned" name="Assigned Hours" fill="#8b7cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {workloadData.find((m) => m.capacity > 0 && m.assigned > m.capacity) ? (
            (() => {
              const overloaded = workloadData.find((m) => m.capacity > 0 && m.assigned > m.capacity);
              return (
                <div className="workload-alert">
                  <span className="alert-icon">
                    <AlertTriangle size={16} />
                  </span>
                  <div>
                    <strong>{overloaded.name} is operating over capacity</strong>
                    <p>{overloaded.assigned}h assigned against {overloaded.capacity}h weekly capacity. Rebalancing recommended.</p>
                  </div>
                  <button onClick={() => setActiveNav("Team workload")}>Review</button>
                </div>
              );
            })()
          ) : (
            <div style={{ padding: "10px 14px", background: "#111b24", border: "1px solid #1d3330", borderRadius: "8px", marginTop: "8px", fontSize: "11px", color: "#72dcb5", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} /> All assigned team members are within healthy weekly capacity limits.
            </div>
          )}

          <button className="text-link full-link" onClick={() => setActiveNav("Team workload")}>
            View Team Capacity Breakdown <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      {/* AI Intelligence Banner */}
      <section className="ai-banner">
        <div className="ai-banner-icon">
          <Sparkles size={22} />
        </div>
        <div className="ai-banner-copy">
          <span className="ai-eyebrow">TEAMPULSE AI ENGINE</span>
          <h2>Critical Path Delay & Workload Imbalance Detected</h2>
          <p>
            One active blocker on '{tasks.find((t) => t.status === "Blocked")?.title || "frontend integration"}'
            is delaying downstream tasks. Reassigning Task 12 can balance Rahul's schedule.
          </p>
        </div>
        <button className="button-ai" onClick={() => setActiveNav("Dependencies")}>
          <GitBranch size={16} /> Inspect Dependency Graph
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 TeamPulse AI</span>
        <span>
          <span className="footer-live" /> Real-time Connected · MongoDB Persistent
        </span>
        <span>TechTrix'26 BONUS 02 Project</span>
      </footer>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={Boolean(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => loadDashboardData()}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
