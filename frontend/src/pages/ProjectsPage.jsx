import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckCircle2,
  ListTodo,
  X,
  Settings,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useProject } from "../context/ProjectContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { projectsAPI } from "../services/api.js";

export default function ProjectsPage({ showCreateModal, setShowCreateModal }) {
  const { projects, activeProject, selectProject, fetchProjects } = useProject();
  const { user } = useAuth();

  // Create Project Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [createRequireReview, setCreateRequireReview] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Manage Modal State
  const [manageProject, setManageProject] = useState(null);
  const [manageTab, setManageTab] = useState("team"); // "team" | "settings"
  const [manageLoading, setManageLoading] = useState(false);

  // Manage Settings State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editRequireReview, setEditRequireReview] = useState(false);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Team Member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Invitations List
  const [pendingInvitations, setPendingInvitations] = useState([]);

  // Toast
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Determine current user's role on manageProject
  const currentUserId = user?.id || user?._id;
  const isOwner =
    manageProject &&
    (manageProject.ownerId?._id === currentUserId ||
      manageProject.ownerId === currentUserId ||
      manageProject.members?.some(
        (m) =>
          (m.userId?._id === currentUserId || m.userId === currentUserId) &&
          m.role === "Project Owner"
      ));

  const isManager =
    isOwner ||
    (manageProject &&
      manageProject.members?.some(
        (m) =>
          (m.userId?._id === currentUserId || m.userId === currentUserId) &&
          m.role === "Project Manager"
      ));

  // Open Manage Modal
  const openManageModal = async (project) => {
    setManageProject(project);
    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setEditDeadline(
      project.targetDeadline ? project.targetDeadline.slice(0, 10) : ""
    );
    setEditRequireReview(Boolean(project.settings?.requireReviewForDone));
    setGeneratedInviteLink("");
    setInviteEmail("");
    setInviteRole("Team Member");
    setManageTab("team");

    // Fetch full project details & pending invitations
    try {
      const [projRes, invRes] = await Promise.all([
        projectsAPI.getProjectById(project._id),
        projectsAPI.getInvitations(project._id).catch(() => ({ data: { invitations: [] } })),
      ]);
      if (projRes.data.success) {
        setManageProject(projRes.data.project);
        setEditRequireReview(Boolean(projRes.data.project.settings?.requireReviewForDone));
      }
      if (invRes.data?.invitations) {
        setPendingInvitations(invRes.data.invitations);
      }
    } catch (err) {
      console.error("Error opening manage modal:", err);
    }
  };

  const refreshManageData = async () => {
    if (!manageProject) return;
    try {
      const [projRes, invRes] = await Promise.all([
        projectsAPI.getProjectById(manageProject._id),
        projectsAPI.getInvitations(manageProject._id).catch(() => ({ data: { invitations: [] } })),
      ]);
      if (projRes.data.success) {
        setManageProject(projRes.data.project);
      }
      if (invRes.data?.invitations) {
        setPendingInvitations(invRes.data.invitations);
      }
    } catch (err) {
      console.error("Failed to refresh manage data:", err);
    }
  };

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetDeadline) return;

    setCreateLoading(true);
    try {
      const res = await projectsAPI.createProject({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim(),
        targetDeadline,
        settings: {
          requireReviewForDone: createRequireReview,
        },
      });

      if (res.data.success) {
        showToast("Project created successfully!");
        setShowCreateModal(false);
        setName("");
        setCode("");
        setDescription("");
        setTargetDeadline("");
        setCreateRequireReview(false);
        await fetchProjects();
        selectProject(res.data.project);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create project.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Save Project Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!manageProject) return;

    setManageLoading(true);
    try {
      const res = await projectsAPI.updateProject(manageProject._id, {
        name: editName.trim(),
        description: editDescription.trim(),
        targetDeadline: editDeadline,
        settings: {
          ...manageProject.settings,
          requireReviewForDone: editRequireReview,
        },
      });

      if (res.data.success) {
        showToast("Project settings saved!");
        await fetchProjects();
        refreshManageData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save project settings.");
    } finally {
      setManageLoading(false);
    }
  };

  // Send Invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !manageProject) return;

    setInviteLoading(true);
    try {
      const res = await projectsAPI.createInvitation(manageProject._id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (res.data.success) {
        showToast("Invitation created!");
        setGeneratedInviteLink(res.data.inviteLink);
        setInviteEmail("");
        refreshManageData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy Invite Link
  const copyInviteLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast("Invite link copied to clipboard!");
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invitationId) => {
    if (!manageProject) return;
    try {
      const res = await projectsAPI.revokeInvitation(manageProject._id, invitationId);
      if (res.data.success) {
        showToast("Invitation revoked.");
        refreshManageData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to revoke invitation.");
    }
  };

  // Regenerate Invitation Link
  const handleRegenerateInvitation = async (invitationId) => {
    if (!manageProject) return;
    try {
      const res = await projectsAPI.regenerateInvitation(manageProject._id, invitationId);
      if (res.data.success) {
        if (res.data.inviteLink) {
          navigator.clipboard.writeText(res.data.inviteLink);
          showToast("Invitation regenerated & link copied to clipboard!");
        } else {
          showToast("Invitation regenerated!");
        }
        refreshManageData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to regenerate invitation.");
    }
  };

  // Update Member Role
  const handleRoleChange = async (memberUserId, newRole) => {
    if (!manageProject) return;
    try {
      const res = await projectsAPI.updateMemberRole(manageProject._id, memberUserId, {
        role: newRole,
      });
      if (res.data.success) {
        showToast(`Role updated to ${newRole}`);
        refreshManageData();
        fetchProjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role.");
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }
    try {
      const res = await projectsAPI.removeMember(manageProject._id, memberUserId);
      if (res.data.success) {
        showToast("Member removed from project.");
        refreshManageData();
        fetchProjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove member.");
    }
  };

  // Archive Project
  const handleArchiveProject = async () => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${manageProject?.name}"? It will no longer be visible in your portfolio.`
      )
    ) {
      return;
    }
    try {
      const res = await projectsAPI.deleteProject(manageProject._id);
      if (res.data.success) {
        showToast("Project archived.");
        setManageProject(null);
        await fetchProjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to archive project.");
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
          <p>Manage software initiatives, peer review quality gates, and team rosters.</p>
        </div>
        <div className="heading-actions">
          <button className="button-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Projects Grid or Zero Data State */}
      {projects.length === 0 ? (
        <div
          className="panel"
          style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "#111729",
            border: "1px dashed #2c354e",
            borderRadius: "14px",
            maxWidth: "680px",
            margin: "40px auto",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#241f3d",
              color: "#9b8cff",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
            }}
          >
            <FolderKanban size={28} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "#e8ebf5" }}>
            No Projects in Your Portfolio
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "#8993ad",
              maxWidth: "420px",
              margin: "0 auto 24px",
              lineHeight: 1.5,
            }}
          >
            Get started by creating your first student software initiative, or ask your project owner for an invitation link to join an existing workspace.
          </p>
          <button className="button-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Your First Project
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
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
                  border: isActive ? "1px solid #6b5cba" : "1px solid #20283b",
                  padding: "22px",
                  borderRadius: "12px",
                  transition: "border 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#9b8cff",
                        fontWeight: 700,
                        letterSpacing: "1.2px",
                      }}
                    >
                      {p.code}
                    </span>
                    <strong
                      style={{
                        fontSize: "16px",
                        color: "#e8ebf5",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      {p.name}
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "3px 8px",
                      borderRadius: "5px",
                      background: isActive ? "#292444" : "#1a2133",
                      color: isActive ? "#c6beff" : "#818ba5",
                      fontWeight: 700,
                    }}
                  >
                    {isActive ? "ACTIVE WORKSPACE" : p.status || "In Progress"}
                  </span>
                </div>

                {p.description && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9ca5bd",
                      margin: "0 0 16px",
                      lineHeight: "1.5",
                    }}
                  >
                    {p.description}
                  </p>
                )}

                {/* Quality Gate Badge */}
                {p.settings?.requireReviewForDone && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "9px",
                      color: "#bbaaff",
                      background: "#241f3d",
                      border: "1px solid #3d3361",
                      borderRadius: "4px",
                      padding: "3px 7px",
                      marginBottom: "14px",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Shield size={10} /> Peer Review Gate Active
                  </div>
                )}

                {/* Progress track */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ color: "#818ba5" }}>
                      Progress ({p.completedTasks || 0}/{p.totalTasks || 0} tasks)
                    </span>
                    <strong style={{ color: "#9b8cff" }}>{p.completionRate || 0}%</strong>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "#1e263a",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
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
                    paddingTop: "14px",
                    borderTop: "1px solid #1c2438",
                    fontSize: "10px",
                    color: "#818ba5",
                    marginBottom: "14px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Users size={12} /> {p.members?.length || 1} member(s)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} /> {new Date(p.targetDeadline).toLocaleDateString()}
                  </span>
                </div>

                {/* Action buttons on card */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={isActive ? "button-secondary" : "button-primary"}
                    style={{ flex: 1, fontSize: "11px", height: "34px" }}
                    onClick={() => selectProject(p)}
                  >
                    {isActive ? "Active Workspace" : "Open Workspace"}
                  </button>
                  <button
                    className="button-secondary"
                    style={{
                      fontSize: "11px",
                      height: "34px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "0 10px",
                    }}
                    title="Manage Team & Project Settings"
                    onClick={() => openManageModal(p)}
                  >
                    <Settings size={13} /> Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE PROJECT MODAL ==================== */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <form className="task-modal" onSubmit={handleCreateProject}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">NEW INITIATIVE</span>
                <h2>Create Project</h2>
                <p>Set up objectives, target deadline, and peer review policies.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <label className="form-label">
              Project Name *
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Task Scheduler"
                required
              />
            </label>

            <div className="form-row">
              <label className="form-label">
                Project Code (Short)
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. DTS"
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
                placeholder="Brief project goals, architecture, and expected deliverables..."
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

            {/* Quality Gate Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "#161c30",
                border: "1px solid #28324a",
                borderRadius: "8px",
                padding: "12px",
                cursor: "pointer",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                checked={createRequireReview}
                onChange={(e) => setCreateRequireReview(e.target.checked)}
                style={{ marginTop: "2px" }}
              />
              <div>
                <strong style={{ fontSize: "11px", color: "#e8ebf5", display: "block" }}>
                  Enforce Peer Review Gate (`requireReviewForDone`)
                </strong>
                <span style={{ fontSize: "10px", color: "#8993ad", lineHeight: 1.4 }}>
                  Tasks cannot be moved to "Done" until an approved peer review decision is recorded.
                </span>
              </div>
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button-primary" disabled={createLoading}>
                {createLoading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MANAGE TEAM & SETTINGS MODAL ==================== */}
      {manageProject && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setManageProject(null)}
        >
          <div
            className="task-modal"
            style={{ width: "min(100%, 640px)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-head">
              <div>
                <span className="modal-kicker">PROJECT MANAGEMENT</span>
                <h2>{manageProject.name}</h2>
                <p>Team members, roles, peer review policies, and settings.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setManageProject(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #232c42",
                paddingBottom: "10px",
                marginBottom: "18px",
              }}
            >
              <button
                type="button"
                className="button-secondary"
                style={{
                  background: manageTab === "team" ? "#292444" : "transparent",
                  color: manageTab === "team" ? "#c6beff" : "#8993ad",
                  borderColor: manageTab === "team" ? "#4a3e75" : "transparent",
                  fontSize: "11px",
                  height: "32px",
                }}
                onClick={() => setManageTab("team")}
              >
                <Users size={13} /> Team & Collaborators ({manageProject.members?.length || 1})
              </button>
              <button
                type="button"
                className="button-secondary"
                style={{
                  background: manageTab === "settings" ? "#292444" : "transparent",
                  color: manageTab === "settings" ? "#c6beff" : "#8993ad",
                  borderColor: manageTab === "settings" ? "#4a3e75" : "transparent",
                  fontSize: "11px",
                  height: "32px",
                }}
                onClick={() => setManageTab("settings")}
              >
                <Settings size={13} /> Project Settings & Quality Gates
              </button>
            </div>

            {/* TAB 1: TEAM & INVITATIONS */}
            {manageTab === "team" && (
              <div>
                {/* Invite Collaborator Form */}
                <div
                  style={{
                    background: "#111729",
                    border: "1px solid #222b42",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#9b8cff",
                    }}
                  >
                    <UserPlus size={14} /> Invite New Collaborator
                  </div>
                  <form onSubmit={handleSendInvite} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="email"
                      placeholder="teammate@college.edu"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={{
                        flex: "2 1 200px",
                        background: "#0b1020",
                        border: "1px solid #2a344d",
                        borderRadius: "7px",
                        color: "#e8ebf5",
                        padding: "8px 10px",
                        fontSize: "11px",
                      }}
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      style={{
                        flex: "1 1 140px",
                        background: "#0b1020",
                        border: "1px solid #2a344d",
                        borderRadius: "7px",
                        color: "#e8ebf5",
                        padding: "8px 10px",
                        fontSize: "11px",
                      }}
                    >
                      <option value="Team Member">Team Member</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Project Owner">Project Owner</option>
                    </select>
                    <button
                      type="submit"
                      className="button-primary"
                      disabled={inviteLoading}
                      style={{ height: "34px", fontSize: "11px" }}
                    >
                      {inviteLoading ? "Inviting..." : "Send Invite"}
                    </button>
                  </form>

                  {/* Generated Invite Link Feedback */}
                  {generatedInviteLink && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "#182038",
                        border: "1px solid #334063",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#9b8cff",
                          fontWeight: 700,
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Shareable Invitation Link (Active for 7 Days):
                      </span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input
                          readOnly
                          value={generatedInviteLink}
                          style={{
                            flex: 1,
                            background: "#0b1020",
                            border: "1px solid #28334d",
                            borderRadius: "5px",
                            color: "#c6beff",
                            padding: "6px 8px",
                            fontSize: "10px",
                          }}
                        />
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={copyInviteLink}
                          style={{ height: "30px", fontSize: "10px", gap: "4px" }}
                        >
                          {copied ? <Check size={12} color="#56d5ad" /> : <Copy size={12} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Members List */}
                <h3
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: "#808ba5",
                    margin: "0 0 10px",
                  }}
                >
                  Active Team Members ({manageProject.members?.length || 0})
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {manageProject.members?.map((m) => {
                    const memberUser = m.userId || {};
                    const memberId = memberUser._id || memberUser.id || m.userId;
                    const isSelf = memberId === currentUserId;

                    return (
                      <div
                        key={memberId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#111729",
                          border: "1px solid #1f273b",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            className="avatar avatar-violet"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: memberUser.avatarColor || "#39305e",
                              color: "#e8ebf5",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {memberUser.initials ||
                              memberUser.name?.slice(0, 2).toUpperCase() ||
                              "TM"}
                          </div>
                          <div>
                            <strong
                              style={{
                                fontSize: "12px",
                                color: "#e8ebf5",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {memberUser.name || "Team Member"}
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "8px",
                                    padding: "2px 5px",
                                    borderRadius: "3px",
                                    background: "#241f3d",
                                    color: "#9b8cff",
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </strong>
                            <small style={{ fontSize: "10px", color: "#818ba5" }}>
                              {memberUser.email} &bull; {m.weeklyCapacityHours || 20}h/wk
                            </small>
                          </div>
                        </div>

                        {/* Role selector or badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isOwner ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(memberId, e.target.value)}
                              style={{
                                background: "#151c30",
                                border: "1px solid #2f384f",
                                borderRadius: "6px",
                                color: "#e8ebf5",
                                padding: "5px 8px",
                                fontSize: "10px",
                              }}
                            >
                              <option value="Project Owner">Project Owner</option>
                              <option value="Project Manager">Project Manager</option>
                              <option value="Team Member">Team Member</option>
                              <option value="Reviewer">Reviewer</option>
                            </select>
                          ) : (
                            <span
                              style={{
                                fontSize: "9px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "#1a2236",
                                color: "#aab4cc",
                                fontWeight: 600,
                              }}
                            >
                              {m.role}
                            </span>
                          )}

                          {/* Remove button (Owner only, not self if last owner) */}
                          {isOwner && !isSelf && (
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => handleRemoveMember(memberId, memberUser.name || "Member")}
                              title="Remove from project"
                              style={{ color: "#ff8c9c" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        color: "#808ba5",
                        margin: "0 0 10px",
                      }}
                    >
                      Pending Invitations ({pendingInvitations.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {pendingInvitations.map((inv) => (
                        <div
                          key={inv._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#0f1526",
                            border: "1px dashed #28334b",
                            borderRadius: "7px",
                            padding: "8px 12px",
                            fontSize: "11px",
                          }}
                        >
                          <div>
                            <span style={{ color: "#e8ebf5", fontWeight: 600 }}>{inv.email}</span>
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "9px",
                                color: "#9b8cff",
                                background: "#211d3b",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {inv.role}
                            </span>
                            <div style={{ fontSize: "9px", color: "#6a7694", marginTop: "2px" }}>
                              Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => handleRegenerateInvitation(inv._id)}
                              style={{ height: "26px", fontSize: "10px", color: "#9b8cff" }}
                              title="Regenerate single-use token and copy new invite link"
                            >
                              Regenerate & Copy
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => handleRevokeInvitation(inv._id)}
                              style={{ height: "26px", fontSize: "10px", color: "#ff8c9c" }}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SETTINGS & QUALITY GATES */}
            {manageTab === "settings" && (
              <form onSubmit={handleSaveSettings}>
                <label className="form-label">
                  Project Title
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </label>

                <div className="form-row">
                  <label className="form-label">
                    Project Code
                    <input value={manageProject.code || ""} disabled style={{ opacity: 0.6 }} />
                  </label>

                  <label className="form-label">
                    Target Delivery Milestone
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <label className="form-label">
                  Description
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
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

                {/* Quality Gate Enforcer Setting */}
                <div
                  style={{
                    background: "#161b2e",
                    border: "1px solid #2d3852",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "20px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editRequireReview}
                      onChange={(e) => setEditRequireReview(e.target.checked)}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "12px", color: "#e8ebf5", display: "block" }}>
                        Quality Gate: Enforce Peer Review Approval (`requireReviewForDone`)
                      </strong>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#8c96b0",
                          margin: "4px 0 0",
                          lineHeight: 1.5,
                        }}
                      >
                        When enabled, any transition to <strong>Done</strong> status requires a
                        formally approved peer review decision. Unauthorized attempts are rejected with
                        HTTP 422 according to Section 2.2 specifications.
                      </p>
                    </div>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleArchiveProject}
                      style={{
                        background: "transparent",
                        border: "1px solid #5a2e3a",
                        color: "#ff8c9c",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "11px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Trash2 size={13} /> Archive Project
                    </button>
                  )}
                  <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setManageProject(null)}
                    >
                      Close
                    </button>
                    <button type="submit" className="button-primary" disabled={manageLoading}>
                      {manageLoading ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
