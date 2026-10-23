import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useProject } from "./context/ProjectContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import TaskModal from "./components/TaskModal.jsx";

// Route-Level Code Splitting (Lazy-loaded chunks)
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const AcceptInvitePage = lazy(() => import("./pages/AcceptInvitePage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

// Workspace Pages
const OverviewPage = lazy(() => import("./pages/OverviewPage.jsx"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage.jsx"));
const TasksPage = lazy(() => import("./pages/TasksPage.jsx"));
const MilestonesPage = lazy(() => import("./pages/MilestonesPage.jsx"));
const WorkloadPage = lazy(() => import("./pages/WorkloadPage.jsx"));
const DependenciesPage = lazy(() => import("./pages/DependenciesPage.jsx"));
const HealthInsightsPage = lazy(() => import("./pages/HealthInsightsPage.jsx"));
const ContributionsPage = lazy(() => import("./pages/ContributionsPage.jsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.jsx"));

// Lightweight Suspense Fallback
function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        color: "#8993ad",
        fontSize: "12px",
        gap: "8px",
      }}
    >
      <span className="live-dot" style={{ width: "8px", height: "8px" }} />
      Loading view...
    </div>
  );
}

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

  const activeNav = pathToNavMap[location.pathname] || "Overview";

  const handleNavChange = (item) => {
    const targetPath = navToPathMap[item] || "/dashboard";
    navigate(targetPath);
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={handleNavChange}
        mobileOpen={mobileNav}
        setMobileOpen={setMobileNav}
      />
      <main className="main-content">
        <Topbar
          search={search}
          setSearch={setSearch}
          setMobileNav={setMobileNav}
          activeNav={activeNav}
          onOpenCreateTask={() => setShowCreateTaskModal(true)}
        />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route index element={<OverviewPage setActiveNav={handleNavChange} onOpenCreateTask={() => setShowCreateTaskModal(true)} />} />
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
        </Suspense>
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
    <Suspense fallback={<PageFallback />}>
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
        <Route path="/invite" element={<AcceptInvitePage />} />

        {/* Protected Dashboard Area */}
        <Route
          path="/dashboard/*"
          element={user ? <DashboardShell /> : <Navigate to="/login" replace />}
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
