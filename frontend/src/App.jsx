import React, { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { useProject } from "./context/ProjectContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import TaskModal from "./components/TaskModal.jsx";

// Pages
import OverviewPage from "./pages/OverviewPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import MilestonesPage from "./pages/MilestonesPage.jsx";
import WorkloadPage from "./pages/WorkloadPage.jsx";
import DependenciesPage from "./pages/DependenciesPage.jsx";
import HealthInsightsPage from "./pages/HealthInsightsPage.jsx";
import ContributionsPage from "./pages/ContributionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { activeProject } = useProject();
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [authView, setAuthView] = useState("login"); // "login" | "register"

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
        Initializing TeamPulse AI Platform...
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />;
  }

  const renderActiveView = () => {
    switch (activeNav) {
      case "Overview":
        return (
          <OverviewPage
            setActiveNav={setActiveNav}
            onOpenCreateTask={() => setShowCreateTaskModal(true)}
          />
        );
      case "Projects":
        return (
          <ProjectsPage
            showCreateModal={showCreateProjectModal}
            setShowCreateModal={setShowCreateProjectModal}
          />
        );
      case "Task board":
        return (
          <TasksPage
            onOpenCreateTask={() => setShowCreateTaskModal(true)}
            showCreateModal={showCreateTaskModal}
            setShowCreateModal={setShowCreateTaskModal}
          />
        );
      case "Milestones":
        return <MilestonesPage />;
      case "Team workload":
        return <WorkloadPage />;
      case "Dependencies":
        return <DependenciesPage />;
      case "AI insights":
        return <HealthInsightsPage setActiveNav={setActiveNav} />;
      case "Activity & reports":
        return <ContributionsPage />;
      case "Reports":
        return <ReportsPage />;
      default:
        return (
          <OverviewPage
            setActiveNav={setActiveNav}
            onOpenCreateTask={() => setShowCreateTaskModal(true)}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onOpenCreateProject={() => {
          setActiveNav("Projects");
          setShowCreateProjectModal(true);
        }}
        onOpenCreateTask={() => setShowCreateTaskModal(true)}
      />

      <main className="main-content">
        <Topbar
          activeNav={activeNav}
          search={search}
          setSearch={setSearch}
          setMobileNav={setMobileNav}
        />

        {renderActiveView()}
      </main>

      {/* Global Task Modal */}
      {showCreateTaskModal && (
        <TaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={() => {
            // refresh data handled in individual views
          }}
        />
      )}
    </div>
  );
}
