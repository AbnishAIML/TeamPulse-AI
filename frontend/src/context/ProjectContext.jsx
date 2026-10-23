import React, { createContext, useContext, useState, useEffect } from "react";
import { projectsAPI } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import { joinProjectRoom, leaveProjectRoom } from "../services/socket.js";

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await projectsAPI.getProjects();
      if (res.data.success && res.data.projects) {
        setProjects(res.data.projects);
        if (res.data.projects.length > 0) {
          // Check if previously selected project exists in list
          const savedId = localStorage.getItem("teampulse_active_project");
          const found = res.data.projects.find((p) => p._id === savedId);
          const current = found || res.data.projects[0];
          setActiveProject(current);
          joinProjectRoom(current._id);
        } else {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
    }
  }, [token]);

  const selectProject = (project) => {
    if (activeProject) {
      leaveProjectRoom(activeProject._id);
    }
    setActiveProject(project);
    localStorage.setItem("teampulse_active_project", project._id);
    joinProjectRoom(project._id);
  };

  const refreshActiveProject = async () => {
    if (!activeProject) return;
    try {
      const res = await projectsAPI.getProjectById(activeProject._id);
      if (res.data.success) {
        setActiveProject(res.data.project);
      }
    } catch (err) {
      console.error("Error refreshing active project:", err);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        selectProject,
        fetchProjects,
        refreshActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a ProjectProvider");
  return ctx;
};
