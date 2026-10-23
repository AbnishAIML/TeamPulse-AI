import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Sparkles,
  Activity,
  GitBranch,
  Target,
  FileText,
  Zap,
  ChevronDown,
  X,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useProject } from "../context/ProjectContext.jsx";

export default function Sidebar({ activeNav, setActiveNav, mobileNav, setMobileNav, onOpenCreateProject, onOpenCreateTask }) {
  const { user, logout } = useAuth();
  const { projects, activeProject, selectProject } = useProject();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const navGroups = [
    {
      label: "Workspace",
      items: [
        { id: "Overview", label: "Overview", icon: LayoutDashboard },
        { id: "Projects", label: "Projects", icon: FolderKanban, count: projects.length },
        { id: "Task board", label: "Task Board", icon: ListTodo },
        { id: "Milestones", label: "Milestones", icon: Target },
        { id: "Team workload", label: "Team Workload", icon: Users },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { id: "Dependencies", label: "DAG Dependencies", icon: GitBranch, special: true },
        { id: "AI insights", label: "AI Insights & Risk", icon: Sparkles, special: true },
        { id: "Activity & reports", label: "Contribution & Audit", icon: Activity },
        { id: "Reports", label: "Export Reports", icon: FileText },
      ],
    },
  ];

  return (
    <>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Zap size={21} fill="currentColor" />
          </div>
          <div>
            <strong>
              TeamPulse<span>AI</span>
            </strong>
            <small>PROJECT INTELLIGENCE</small>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Project Selector Switcher */}
        <div style={{ position: "relative" }}>
          <button
            className="workspace-switch"
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            title="Switch project"
          >
            <div className="workspace-logo">{activeProject?.code?.slice(0, 2) || "TP"}</div>
            <div className="workspace-label">
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeProject?.name || "TechTrix Workspace"}
              </strong>
              <small>{activeProject?.status || "Active"}</small>
            </div>
            <ChevronDown size={16} className="muted-icon" />
          </button>

          {showProjectDropdown && (
            <div
              style={{
                position: "absolute",
                top: "105%",
                left: 0,
                right: 0,
                background: "#151c30",
                border: "1px solid #303951",
                borderRadius: "10px",
                padding: "8px",
                zIndex: 50,
                boxShadow: "0 10px 30px #0008",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#808ba5",
                  padding: "4px 8px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Switch Project
              </div>
              {projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    selectProject(p);
                    setShowProjectDropdown(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px",
                    background: p._id === activeProject?._id ? "#292544" : "transparent",
                    color: p._id === activeProject?._id ? "#c6beff" : "#e8ebf5",
                    border: 0,
                    borderRadius: "6px",
                    textAlign: "left",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: p._id === activeProject?._id ? "#9b8cff" : "#404a65",
                    }}
                  />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowProjectDropdown(false);
                  onOpenCreateProject?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "100%",
                  marginTop: "6px",
                  padding: "7px 8px",
                  background: "#20283b",
                  color: "#9b8cff",
                  border: "1px dashed #394563",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={13} /> New Project
              </button>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="nav-list">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-heading">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeNav === item.id ? "active" : ""} ${
                    item.special ? "nav-special" : ""
                  }`}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileNav(false);
                  }}
                >
                  <item.icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {item.count !== undefined && <em>{item.count}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar bottom with upgrade prompt and user profile */}
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-spark">
              <Sparkles size={17} />
            </div>
            <strong>AI Intelligence Engine</strong>
            <p>DAG cycle check, CPM scheduling, and auto-workload rebalancing active.</p>
            <button onClick={() => setActiveNav("AI insights")}>
              View Health Analysis →
            </button>
          </div>

          <div className="profile-row">
            <span className={`avatar avatar-${user?.avatarColor || "blue"}`}>
              {user?.initials || "AK"}
            </span>
            <div className="profile-info">
              <strong>{user?.name || "Ankit Kumar"}</strong>
              <small>{user?.title || "Project Lead"}</small>
            </div>
            <button
              className="icon-button"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
    </>
  );
}
