import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useProject } from "./context/ProjectContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import TaskModal from "./components/TaskModal.jsx";

// Public Pages
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Workspace Pages
import OverviewPage from "./pages/OverviewPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import MilestonesPage from "./pages/MilestonesPage.jsx";
import WorkloadPage from "./pages/WorkloadPage.jsx";
import DependenciesPage from "./pages/DependenciesPage.jsx";
import HealthInsightsPage from "./pages/HealthInsightsPage.jsx";
import ContributionsPage from "./pages/ContributionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProject } = useProject();

  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Sync activeNav with URL path
  const pathToNavMap = {
    "/dashboard": "Overview",
    "/dashboard/projects": "Projects",
    "/dashboard/tasks": "Task board",
    "/dashboard/milestones": "Milestones",
    "/dashboard/workload": "Team workload",
    "/dashboard/dependencies": "Dependencies",
    "/dashboard/insights": "AI insights",
    "/dashboard/activity": "Activity & reports",
    "/dashboard/reports": "Reports",
  };

  const navToPathMap = {
    Overview: "/dashboard",
    Projects: "/dashboard/projects",
    "Task board": "/dashboard/tasks",
    Milestones: "/dashboard/milestones",
    "Team workload": "/dashboard/workload",
    Dependencies: "/dashboard/dependencies",
    "AI insights": "/dashboard/insights",
    "Activity & reports": "/dashboard/activity",
    Reports: "/dashboard/reports",
  };

  const currentNav = pathToNavMap[location.pathname] || "Overview";

  const handleNavChange = (navId) => {
    const targetPath = navToPathMap[navId] || "/dashboard";
    navigate(targetPath);
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeNav={currentNav}
        setActiveNav={handleNavChange}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onOpenCreateProject={() => {
          navigate("/dashboard/projects");
          setShowCreateProjectModal(true);
        }}
        onOpenCreateTask={() => setShowCreateTaskModal(true)}
      />

      <main className="main-content">
        <Topbar
          activeNav={currentNav}
          search={search}
          setSearch={setSearch}
          setMobileNav={setMobileNav}
        />

        <Routes>
          <Route
            path=""
            element={
              <OverviewPage
                setActiveNav={handleNavChange}
                onOpenCreateTask={() => setShowCreateTaskModal(true)}
              />
            }
          />
          <Route
            path="projects"
            element={
              <ProjectsPage
                showCreateModal={showCreateProjectModal}
                setShowCreateModal={setShowCreateProjectModal}
              />
            }
          />
          <Route
            path="tasks"
            element={
              <TasksPage
                onOpenCreateTask={() => setShowCreateTaskModal(true)}
                showCreateModal={showCreateTaskModal}
                setShowCreateModal={setShowCreateTaskModal}
              />
            }
          />
          <Route path="milestones" element={<MilestonesPage />} />
          <Route path="workload" element={<WorkloadPage />} />
          <Route path="dependencies" element={<DependenciesPage />} />
          <Route path="insights" element={<HealthInsightsPage setActiveNav={handleNavChange} />} />
          <Route path="activity" element={<ContributionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Global Task Modal */}
      {showCreateTaskModal && (
        <TaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={() => {}}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#080c18",
          color: "#9b8cff",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="brand-mark" style={{ width: "42px", height: "42px" }}>
            <span className="live-dot" style={{ width: "12px", height: "12px" }} />
          </div>
          Initializing TeamPulse AI Platform...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Dashboard Area */}
      <Route
        path="/dashboard/*"
        element={user ? <DashboardShell /> : <Navigate to="/login" replace />}
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
