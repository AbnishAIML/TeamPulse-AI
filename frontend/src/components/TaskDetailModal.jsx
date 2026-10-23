import React, { useState, useEffect } from "react";
import {
  X,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Send,
  Paperclip,
  Check,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  FileText,
  UserCheck,
  Trash2,
} from "lucide-react";
import { tasksAPI, commentsAPI, reviewsAPI, attachmentsAPI } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TaskDetailModal({ taskId, isOpen, onClose, onTaskUpdated }) {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [successors, setSuccessors] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockerReason, setBlockerReason] = useState("");
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewDecisionForm, setShowReviewDecisionForm] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadTaskData = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
        tasksAPI.getTaskById(taskId),
        commentsAPI.getComments(taskId),
        attachmentsAPI.getAttachments(taskId),
      ]);

      if (taskRes.data.success) {
        setTask(taskRes.data.task);
        setSuccessors(taskRes.data.successors || []);
      }
      if (commentsRes.data.success) {
        setComments(commentsRes.data.comments);
      }
      if (attachmentsRes.data.success) {
        setAttachments(attachmentsRes.data.attachments);
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
      setError("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskData();
    }
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      setError("");
      const res = await tasksAPI.updateStatus(taskId, newStatus);
      if (res.data.success) {
        setTask(res.data.task);
        onTaskUpdated?.(res.data.task);
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleReportBlocker = async (e) => {
    e.preventDefault();
    if (!blockerReason.trim()) return;
    try {
      setError("");
      const res = await tasksAPI.reportBlocker(taskId, {
        reason: blockerReason.trim(),
        severity: "High",
      });
      if (res.data.success) {
        setTask(res.data.task);
        setShowBlockerForm(false);
        setBlockerReason("");
        onTaskUpdated?.(res.data.task);
        showToast("Blocker reported and team alerted.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to report blocker.");
    }
  };

  const handleResolveBlocker = async () => {
    try {
      setError("");
      const res = await tasksAPI.resolveBlocker(taskId);
      if (res.data.success) {
        setTask(res.data.task);
        onTaskUpdated?.(res.data.task);
        showToast("Blocker resolved! Task restored to In Progress.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve blocker.");
    }
  };

  const handleRequestReview = async () => {
    try {
      setError("");
      const res = await reviewsAPI.requestReview(taskId, reviewNotes);
      if (res.data.success) {
        setTask(res.data.task);
        setReviewNotes("");
        onTaskUpdated?.(res.data.task);
        showToast("Task submitted for peer review.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request review.");
    }
  };

  const handleReviewDecision = async (decision) => {
    try {
      setError("");
      const res = await reviewsAPI.submitDecision(taskId, decision, reviewFeedback);
      if (res.data.success) {
        setTask(res.data.task);
        setShowReviewDecisionForm(false);
        setReviewFeedback("");
        onTaskUpdated?.(res.data.task);
        showToast(`Deliverable review ${decision.toLowerCase()}!`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit decision.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await commentsAPI.addComment(taskId, newComment.trim());
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment("");
      }
    } catch (err) {
      setError("Failed to post comment.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await attachmentsAPI.uploadAttachment(taskId, formData);
      if (res.data.success) {
        setAttachments((prev) => [res.data.attachment, ...prev]);
        showToast(`Uploaded ${file.name}`);
      }
    } catch (err) {
      setError("Failed to upload file.");
    }
  };

  const handleDeleteAttachment = async (attachmentId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await attachmentsAPI.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      showToast("Attachment deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete attachment.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="task-modal"
        style={{
          width: "min(100%, 720px)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#808ba5" }}>
            Loading task details...
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="modal-head" style={{ marginBottom: "14px" }}>
              <div>
                <span className="modal-kicker">
                  {task.milestoneId?.title || "TASK DETAILS"}
                </span>
                <h2 style={{ fontSize: "20px" }}>{task.title}</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Close modal">
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

            {/* Status & Priority Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: "#0e1425",
                borderRadius: "10px",
                border: "1px solid #252d42",
                marginBottom: "16px",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", color: "#818ba5", display: "block" }}>Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    background: "#151c30",
                    border: "1px solid #303951",
                    color: "#e8ebf5",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    marginTop: "3px",
                  }}
                >
                  <option value="Backlog">Backlog</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "#818ba5", display: "block" }}>Priority</span>
                <span
                  className={`priority priority-${task.priority.toLowerCase()}`}
                  style={{ marginTop: "4px" }}
                >
                  <i></i> {task.priority}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "#818ba5", display: "block" }}>Assignee</span>
                <span style={{ fontSize: "11px", color: "#dce1f0", fontWeight: 600 }}>
                  {task.assigneeId?.name || "Unassigned"}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "#818ba5", display: "block" }}>Effort</span>
                <span style={{ fontSize: "11px", color: "#9b8cff" }}>
                  {task.actualHours || 0}h logged / {task.estimatedHours || 0}h estimated
                </span>
              </div>
            </div>

            {/* Blocker alert / actions */}
            {task.blocker?.isBlocked ? (
              <div
                style={{
                  background: "#3b1e2c",
                  border: "1px solid #633045",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ff8c9c" }}>
                  <AlertTriangle size={17} />
                  <strong style={{ fontSize: "12px" }}>Active Task Blocker</strong>
                </div>
                <p style={{ fontSize: "11px", color: "#e8cfd8", margin: "6px 0 10px" }}>
                  {task.blocker.reason}
                </p>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleResolveBlocker}
                  style={{ height: "30px", fontSize: "10px" }}
                >
                  <Check size={13} /> Mark Blocker Resolved
                </button>
              </div>
            ) : (
              !showBlockerForm && (
                <div style={{ marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowBlockerForm(true)}
                    style={{
                      background: "transparent",
                      border: "1px solid #4a3428",
                      color: "#ffbd7c",
                      borderRadius: "6px",
                      padding: "5px 9px",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <AlertTriangle size={13} /> Report Blocker Issue
                  </button>
                </div>
              )
            )}

            {showBlockerForm && (
              <div
                style={{
                  background: "#251c20",
                  border: "1px solid #4a293b",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "16px",
                }}
              >
                <strong style={{ fontSize: "11px", color: "#ff9ca9" }}>Report Blocker</strong>
                <input
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Explain what is blocking progress..."
                  style={{
                    width: "100%",
                    background: "#111729",
                    border: "1px solid #3d2b38",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "8px",
                    fontSize: "11px",
                    margin: "8px 0",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={handleReportBlocker}
                    style={{ height: "28px", fontSize: "10px" }}
                  >
                    Submit Blocker
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setShowBlockerForm(false)}
                    style={{ height: "28px", fontSize: "10px" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Review and Approval section */}
            <div
              style={{
                background: "#141c30",
                border: "1px solid #28334d",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} color="#9b8cff" />
                  <strong style={{ fontSize: "11px" }}>Review & Quality Gate</strong>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    background:
                      task.review?.status === "Approved"
                        ? "#1c4038"
                        : task.review?.status === "Pending Review"
                        ? "#223651"
                        : "#252d42",
                    color:
                      task.review?.status === "Approved"
                        ? "#72dcb5"
                        : task.review?.status === "Pending Review"
                        ? "#9fc5ff"
                        : "#818ba5",
                  }}
                >
                  {task.review?.status || "None"}
                </span>
              </div>

              {task.review?.feedback && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#aeb7cc",
                    marginTop: "8px",
                    padding: "6px 8px",
                    background: "#0c1122",
                    borderRadius: "6px",
                  }}
                >
                  <strong>Review Feedback:</strong> {task.review.feedback}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                {task.review?.status !== "Pending Review" && task.status !== "Done" && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleRequestReview}
                    style={{ height: "28px", fontSize: "10px" }}
                  >
                    <UserCheck size={13} /> Request Peer Review
                  </button>
                )}

                {task.review?.status === "Pending Review" && (
                  <>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => handleReviewDecision("Approved")}
                      style={{ height: "28px", fontSize: "10px", background: "#397d5c" }}
                    >
                      <Check size={13} /> Approve Deliverable
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setShowReviewDecisionForm(true)}
                      style={{ height: "28px", fontSize: "10px", color: "#ff9ca9" }}
                    >
                      Request Changes
                    </button>
                  </>
                )}
              </div>

              {showReviewDecisionForm && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Specify required changes..."
                    style={{
                      width: "100%",
                      background: "#0e1425",
                      border: "1px solid #303951",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "7px",
                      fontSize: "11px",
                      marginBottom: "6px",
                    }}
                  />
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => handleReviewDecision("Changes Requested")}
                    style={{ height: "26px", fontSize: "10px" }}
                  >
                    Send Change Request
                  </button>
                </div>
              )}
            </div>

            {/* Dependencies */}
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "11px", color: "#aab4cc", display: "block", marginBottom: "6px" }}>
                Finish-to-Start Dependencies:
              </strong>
              {task.dependencies?.length === 0 ? (
                <div style={{ fontSize: "11px", color: "#6d7894" }}>No predecessor dependencies.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {task.dependencies.map((d) => (
                    <div
                      key={d._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        background: "#0e1425",
                        borderRadius: "6px",
                        fontSize: "11px",
                        border: "1px solid #20283b",
                      }}
                    >
                      <span>
                        Predecessor: <strong>{d.title}</strong>
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          color: d.status === "Done" ? "#72dcb5" : "#ffbd7c",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {successors.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#818ba5" }}>
                    Successor tasks waiting on this:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {successors.map((s) => (
                      <span
                        key={s._id}
                        style={{
                          fontSize: "10px",
                          padding: "3px 6px",
                          background: "#1c253d",
                          borderRadius: "4px",
                          color: "#c2ccdf",
                        }}
                      >
                        {s.title} ({s.status})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <strong style={{ fontSize: "11px", color: "#aab4cc" }}>File Attachments</strong>
                <label
                  style={{
                    fontSize: "10px",
                    color: "#9b8cff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Paperclip size={12} /> Upload file
                  <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>

              {attachments.length === 0 ? (
                <div style={{ fontSize: "10px", color: "#6d7894" }}>No attachments uploaded yet.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {attachments.map((att) => (
                    <div
                      key={att._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 8px",
                        background: "#141c30",
                        border: "1px solid #28334d",
                        borderRadius: "6px",
                        fontSize: "10px",
                      }}
                    >
                      <a
                        href={attachmentsAPI.getDownloadUrl(att._id)}
                        download
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#c6beff",
                          textDecoration: "none",
                        }}
                      >
                        <FileText size={13} /> {att.originalName}
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAttachment(att._id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff8c9c",
                          cursor: "pointer",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Delete attachment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "8px",
                  color: "#aab4cc",
                }}
              >
                <MessageSquare size={14} />
                <strong style={{ fontSize: "11px" }}>Discussion & Activity Comments</strong>
              </div>

              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingRight: "4px",
                }}
              >
                {comments.length === 0 ? (
                  <div style={{ fontSize: "10px", color: "#6d7894" }}>No comments yet.</div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        padding: "8px 10px",
                        background: "#0e1425",
                        borderRadius: "8px",
                        border: "1px solid #20283b",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "10px",
                          color: "#818ba5",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>{c.authorId?.name || "Team Member"}</strong>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#e8ebf5", lineHeight: "1.4" }}>
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  style={{
                    flex: 1,
                    background: "#0e1425",
                    border: "1px solid #303951",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "8px",
                    fontSize: "11px",
                  }}
                />
                <button
                  type="submit"
                  className="button-primary"
                  style={{ height: "34px", padding: "0 10px" }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </>
        ) : null}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
