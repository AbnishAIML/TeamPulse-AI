import React, { useState, useEffect } from "react";
import {
  GitBranch,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Play,
  X,
  Activity,
  Layers,
} from "lucide-react";
import { dependenciesAPI, tasksAPI } from "../services/api.js";
import { useProject } from "../context/ProjectContext.jsx";

export default function DependenciesPage() {
  const { activeProject } = useProject();
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedPredId, setSelectedPredId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Delay Simulation State
  const [showSimModal, setShowSimModal] = useState(false);
  const [simTaskId, setSimTaskId] = useState("");
  const [simHours, setSimHours] = useState(16);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadDependencies = async () => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const [depRes, tasksRes] = await Promise.all([
        dependenciesAPI.getDependencies(activeProject._id),
        tasksAPI.getTasks(activeProject._id),
      ]);

      if (depRes.data.success) {
        setData(depRes.data.analysis);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err) {
      console.error("Error loading dependency graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, [activeProject?._id]);

  const handleAddDependency = async (e) => {
    e.preventDefault();
    if (!selectedTaskId || !selectedPredId) return;
    setError("");

    try {
      const res = await dependenciesAPI.addDependency(selectedTaskId, selectedPredId);
      if (res.data.success) {
        showToast("Dependency link established successfully!");
        setShowAddModal(false);
        loadDependencies();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add dependency.");
    }
  };

  const handleRemoveDependency = async (taskId, predId) => {
    if (!window.confirm("Remove this dependency link?")) return;
    try {
      const res = await dependenciesAPI.removeDependency(taskId, predId);
      if (res.data.success) {
        showToast("Dependency removed.");
        loadDependencies();
      }
    } catch (err) {
      showToast("Failed to remove dependency.");
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!simTaskId || !simHours) return;
    setSimulating(true);
    try {
      const res = await dependenciesAPI.simulateDelay(activeProject._id, {
        delayedTaskId: simTaskId,
        delayHours: Number(simHours),
      });
      if (res.data.success) {
        setSimResult(res.data.simulation);
        showToast("Delay propagation simulation complete!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  const criticalPathSet = new Set(data?.critical_path || []);

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> DAG & CRITICAL PATH METHOD
          </div>
          <h1>Task Dependency & Delay Propagation</h1>
          <p>
            Finish-to-start directed acyclic graph (DAG), critical path scheduling, and blocker root-cause analysis.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button-secondary"
            onClick={() => {
              setShowSimModal(true);
              setSimResult(null);
              if (tasks.length > 0 && !simTaskId) {
                setSimTaskId(tasks[0]._id);
              }
            }}
          >
            <Play size={14} /> What-If Delay Simulation
          </button>
          <button className="button-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Link Dependency
          </button>
        </div>
      </div>

      {/* Cycle Detection Status Banner */}
      {data?.has_cycle ? (
        <div
          style={{
            background: "#4a232f",
            border: "1px solid #7a3245",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <ShieldAlert size={28} color="#ff8c9c" />
          <div>
            <strong style={{ color: "#ff8c9c", fontSize: "13px" }}>Circular Dependency Cycle Detected!</strong>
            <p style={{ color: "#eed5dc", fontSize: "11px", margin: "4px 0 0" }}>
              Cycle nodes: {data.cycle_nodes?.join(" ➔ ")}. Topological scheduling is blocked until loops are resolved.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#16233b",
            border: "1px solid #283e68",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <GitBranch size={22} color="#62aaff" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: "#a9d0ff", fontSize: "12px" }}>DAG Graph Verified (Zero Cycles)</strong>
            <p style={{ color: "#8fa3c7", fontSize: "10px", margin: "2px 0 0" }}>
              Topological execution sequence: {data?.topological_order?.length || 0} tasks mapped. Estimated project duration:{" "}
              {data?.project_duration_hours || 0} hours.
            </p>
          </div>
          {data?.critical_path?.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#3b2650",
                color: "#d0bdff",
                border: "1px solid #583c74",
                padding: "4px 9px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              <Flame size={13} color="#b6a9ff" /> Critical Path: {data.critical_path.length} Tasks
            </span>
          )}
        </div>
      )}

      {/* Critical Path Sequence Bar */}
      {data?.critical_path?.length > 0 && (
        <div
          className="panel"
          style={{
            marginBottom: "20px",
            background: "linear-gradient(130deg, #1e1933, #111729)",
            border: "1px solid #3c2f5d",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Flame size={16} color="#b6a9ff" />
            <h2 style={{ fontSize: "13px", margin: 0 }}>Critical Path (Zero Slack / Maximum Float)</h2>
          </div>
          <p style={{ fontSize: "11px", color: "#9ca5bd", marginBottom: "14px" }}>
            Any delay to these tasks directly slips the final project delivery date:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            {data.critical_path.map((tId, idx) => {
              const taskObj = tasks.find((t) => t._id === tId);
              return (
                <React.Fragment key={tId}>
                  <div
                    style={{
                      background: "#292147",
                      border: "1px solid #5a4282",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "11px",
                      color: "#e8ebf5",
                    }}
                  >
                    <strong>{taskObj?.title || tId}</strong>
                    <div style={{ fontSize: "9px", color: "#b9afff", marginTop: "2px" }}>
                      {taskObj?.remainingHours || taskObj?.estimatedHours || 0}h duration · Slack: 0h
                    </div>
                  </div>
                  {idx < data.critical_path.length - 1 && <ArrowRight size={14} color="#7e71a0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Grid: Blockers Root Cause vs DAG Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Directly Blocked Tasks */}
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <AlertTriangle size={16} color="#ff8c9c" />
            <h2 style={{ fontSize: "13px", margin: 0 }}>
              Directly Blocked Tasks ({data?.blocked_tasks?.length || 0})
            </h2>
          </div>
          <p style={{ fontSize: "10px", color: "#818ba5", marginBottom: "14px" }}>
            Tasks unable to start because immediate predecessors are unfinished:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data?.blocked_tasks?.map((b) => (
              <div
                key={b.task_id}
                style={{
                  background: "#1c1421",
                  border: "1px solid #4a2432",
                  borderRadius: "8px",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <strong style={{ color: "#ff9ca9" }}>{b.task_title}</strong>
                  <span style={{ fontSize: "9px", color: "#818ba5" }}>Impact: {b.delay_impact_hours}h</span>
                </div>
                <div style={{ fontSize: "10px", color: "#d6c1c8", marginTop: "4px" }}>
                  <strong>Root Cause:</strong> {b.reason}
                </div>
              </div>
            ))}
            {(!data?.blocked_tasks || data.blocked_tasks.length === 0) && (
              <div style={{ color: "#72dcb5", fontSize: "11px", textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={16} style={{ display: "inline", marginRight: "6px" }} />
                No directly blocked tasks right now!
              </div>
            )}
          </div>
        </div>

        {/* At-Risk Downstream Tasks */}
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Clock3 size={16} color="#ffbd7c" />
            <h2 style={{ fontSize: "13px", margin: 0 }}>
              At-Risk Downstream Tasks ({data?.at_risk_tasks?.length || 0})
            </h2>
          </div>
          <p style={{ fontSize: "10px", color: "#818ba5", marginBottom: "14px" }}>
            Tasks whose projected schedule will slip due to upstream blockers:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data?.at_risk_tasks?.map((r) => (
              <div
                key={r.task_id}
                style={{
                  background: "#1e1a1a",
                  border: "1px solid #453326",
                  borderRadius: "8px",
                  padding: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <strong style={{ color: "#ffc27d" }}>{r.task_title}</strong>
                  <span style={{ fontSize: "9px", color: "#818ba5" }}>Risk: {r.delay_impact_hours}h</span>
                </div>
                <div style={{ fontSize: "10px", color: "#c9b9af", marginTop: "4px" }}>
                  {r.reason}
                </div>
              </div>
            ))}
            {(!data?.at_risk_tasks || data.at_risk_tasks.length === 0) && (
              <div style={{ color: "#72dcb5", fontSize: "11px", textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={16} style={{ display: "inline", marginRight: "6px" }} />
                No downstream tasks at risk of delay.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task CPM Float and Slack Table */}
      <div className="panel" style={{ marginTop: "20px", padding: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #20283b" }}>
          <h2 style={{ fontSize: "13px", margin: 0 }}>CPM Task Schedule Float & Slack Calculations</h2>
          <p style={{ fontSize: "10px", color: "#818ba5", margin: "4px 0 0" }}>
            Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF), and Total Slack:
          </p>
        </div>
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Status</th>
                <th>Early Start (h)</th>
                <th>Early Finish (h)</th>
                <th>Late Start (h)</th>
                <th>Late Finish (h)</th>
                <th>Total Slack (Float)</th>
                <th>Critical?</th>
                <th>Predecessors</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const metrics = data?.cpm_metrics?.[task._id];
                const isCrit = criticalPathSet.has(task._id);
                return (
                  <tr key={task._id}>
                    <td>
                      <strong>{task.title}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill status-${task.status.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        <span /> {task.status}
                      </span>
                    </td>
                    <td>{metrics ? `${metrics.early_start}h` : "—"}</td>
                    <td>{metrics ? `${metrics.early_finish}h` : "—"}</td>
                    <td>{metrics ? `${metrics.late_start}h` : "—"}</td>
                    <td>{metrics ? `${metrics.late_finish}h` : "—"}</td>
                    <td>
                      <span style={{ color: isCrit ? "#ff8c9c" : "#72dcb5", fontWeight: 700 }}>
                        {metrics ? `${metrics.total_slack}h` : "—"}
                      </span>
                    </td>
                    <td>
                      {isCrit ? (
                        <span style={{ color: "#ff8c9c", fontSize: "9px", fontWeight: 700 }}>
                          CRITICAL
                        </span>
                      ) : (
                        <span style={{ color: "#818ba5", fontSize: "9px" }}>Flexible</span>
                      )}
                    </td>
                    <td>
                      {task.dependencies?.length === 0 ? (
                        <span style={{ color: "#64708a", fontSize: "9px" }}>None</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {task.dependencies.map((pId) => {
                            const pred = tasks.find((t) => t._id === (pId._id || pId));
                            return (
                              <span
                                key={pId._id || pId}
                                style={{
                                  background: "#1c253d",
                                  padding: "2px 5px",
                                  borderRadius: "4px",
                                  fontSize: "9px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                {pred?.title || pId}
                                <Trash2
                                  size={10}
                                  style={{ cursor: "pointer", color: "#ff8c9c" }}
                                  onClick={() => handleRemoveDependency(task._id, pId._id || pId)}
                                />
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dependency Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <form className="task-modal" onSubmit={handleAddDependency}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">FINISH-TO-START DEPENDENCY</span>
                <h2>Link Dependent Tasks</h2>
                <p>Ensure predecessor finishes before successor can begin.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: "#432a34",
                  color: "#ff9ca9",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  marginBottom: "12px",
                }}
              >
                {error}
              </div>
            )}

            <label className="form-label">
              Predecessor Task (Must Finish First)
              <select value={selectedPredId} onChange={(e) => setSelectedPredId(e.target.value)} required>
                <option value="">Select Predecessor...</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Successor Task (Cannot Start Until Predecessor Is Done)
              <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)} required>
                <option value="">Select Successor...</option>
                {tasks
                  .filter((t) => t._id !== selectedPredId)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
              </select>
            </label>

            <div className="modal-note">
              <Sparkles size={16} /> Cycles and self-dependencies are automatically blocked.
            </div>

            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Establish Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* What-If Delay Propagation Simulation Modal */}
      {showSimModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setShowSimModal(false)}
        >
          <div
            className="task-modal"
            style={{ width: "min(100%, 580px)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-head">
              <div>
                <span className="modal-kicker">PREDICTIVE ANALYTICS</span>
                <h2>What-If Delay Propagation</h2>
                <p>Simulate schedule slippage, critical path shifts, and cascading downstream delays.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowSimModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRunSimulation} style={{ marginBottom: "20px" }}>
              <label className="form-label">
                Select Task to Delay
                <select
                  value={simTaskId}
                  onChange={(e) => setSimTaskId(e.target.value)}
                  required
                >
                  <option value="">Select a task...</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.status} &bull; {t.estimatedHours || 0}h)
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Hypothetical Delay (Hours)
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={simHours}
                  onChange={(e) => setSimHours(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowSimModal(false)}
                >
                  Close
                </button>
                <button type="submit" className="button-primary" disabled={simulating || !simTaskId}>
                  {simulating ? "Simulating..." : "Run Simulation"}
                </button>
              </div>
            </form>

            {/* Simulation Results Display */}
            {simResult && (
              <div
                style={{
                  background: "#111729",
                  border: "1px solid #232c44",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#9b8cff",
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Activity size={14} /> Simulation Outcome
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#181f33",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #2a344d",
                    }}
                  >
                    <span style={{ fontSize: "9px", color: "#818ba5", display: "block" }}>
                      Project Slippage
                    </span>
                    <strong
                      style={{
                        fontSize: "16px",
                        color:
                          (simResult.schedule_slippage_hours ?? simResult.project_schedule_slippage_hours ?? 0) > 0
                            ? "#ff8c9c"
                            : "#56d5ad",
                      }}
                    >
                      +{(simResult.schedule_slippage_hours ?? simResult.project_schedule_slippage_hours ?? 0)}h
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#181f33",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #2a344d",
                    }}
                  >
                    <span style={{ fontSize: "9px", color: "#818ba5", display: "block" }}>
                      New Duration
                    </span>
                    <strong style={{ fontSize: "16px", color: "#e8ebf5" }}>
                      {simResult.new_duration_hours ?? simResult.new_project_duration_hours ?? 0}h
                    </strong>
                    <div style={{ fontSize: "9px", color: "#818ba5" }}>
                      from {simResult.original_duration_hours ?? simResult.baseline_duration_hours ?? 0}h
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#181f33",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #2a344d",
                    }}
                  >
                    <span style={{ fontSize: "9px", color: "#818ba5", display: "block" }}>
                      Critical Path
                    </span>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: simResult.critical_path_changed ? "#ffbd7c" : "#9b8cff",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      {simResult.critical_path_changed ? "Shifted" : "Maintained"}
                    </strong>
                  </div>
                </div>

                {/* Cascading Downstream Tasks */}
                <div>
                  {(() => {
                    const affected = simResult.affected_tasks ?? simResult.cascade_affected_tasks ?? [];
                    return (
                      <>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            color: "#818ba5",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          Cascading Downstream Impact ({affected.length} Tasks)
                        </span>

                        {affected.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {affected.map((c, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: "#0d1324",
                                  border: "1px solid #20283b",
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                }}
                              >
                                <span style={{ color: "#e8ebf5" }}>{c.task_title || c.task_id}</span>
                                <div style={{ display: "flex", gap: "10px", fontSize: "10px" }}>
                                  <span style={{ color: "#ff8c9c" }}>
                                    +{(c.delay_shift_hours ?? c.additional_delay_hours ?? 0)}h delay
                                  </span>
                                  {c.new_slack !== undefined && (
                                    <span style={{ color: "#818ba5" }}>Slack: {c.new_slack}h</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#56d5ad",
                              background: "#132321",
                              padding: "8px 12px",
                              borderRadius: "6px",
                            }}
                          >
                            No downstream tasks are blocked by this delay (absorbed by task float/slack).
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
