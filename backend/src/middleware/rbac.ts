import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { Project, ProjectRole } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";

const getProjectRole = (project: any, userId: string): ProjectRole | "Owner" | null => {
  if (project.ownerId.toString() === userId) {
    return "Project Owner";
  }
  const member = project.members.find(
    (m: any) => m.userId.toString() === userId
  );
  return member ? member.role : null;
};

export const requireProjectRole = (allowedRoles: ProjectRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      if (req.user.systemRole === "admin") {
        return next();
      }

      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
      if (!projectId) {
        res.status(400).json({ success: false, message: "Project ID is required to verify permissions." });
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ success: false, message: "Project not found." });
        return;
      }

      const userRole = getProjectRole(project, req.user._id.toString());

      if (!userRole) {
        res.status(403).json({ success: false, message: "You are not a member of this project." });
        return;
      }

      if (allowedRoles.includes(userRole as ProjectRole)) {
        return next();
      }

      res.status(403).json({
        success: false,
        message: `Action not permitted for role '${userRole}'. Required: ${allowedRoles.join(", ")}`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error verifying project permissions.", error: error.message });
    }
  };
};

export const requireProjectMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) {
      res.status(400).json({ success: false, message: "Project ID is required." });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    if (req.user.systemRole === "admin") {
      return next();
    }

    const userRole = getProjectRole(project, req.user._id.toString());
    if (!userRole) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error verifying project membership.",
      error: error.message,
    });
  }
};

export const requireMilestoneRole = (allowedRoles: ProjectRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const { milestoneId } = req.params;
      if (!milestoneId) {
        res.status(400).json({ success: false, message: "Milestone ID is required." });
        return;
      }

      const milestone = await Milestone.findById(milestoneId);
      if (!milestone) {
        res.status(404).json({ success: false, message: "Milestone not found." });
        return;
      }

      const project = await Project.findById(milestone.projectId);
      if (!project) {
        res.status(404).json({ success: false, message: "Associated project not found." });
        return;
      }

      if (req.user.systemRole === "admin") {
        return next();
      }

      const userRole = getProjectRole(project, req.user._id.toString());
      if (!userRole) {
        res.status(403).json({ success: false, message: "Access denied. You are not a member of this project." });
        return;
      }

      if (allowedRoles.includes(userRole as ProjectRole)) {
        return next();
      }

      res.status(403).json({
        success: false,
        message: `Action not permitted for role '${userRole}'. Required: ${allowedRoles.join(", ")}`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error verifying milestone permissions.", error: error.message });
    }
  };
};

export const requireMilestoneMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { milestoneId } = req.params;
    if (!milestoneId) {
      res.status(400).json({ success: false, message: "Milestone ID is required." });
      return;
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: "Milestone not found." });
      return;
    }

    const project = await Project.findById(milestone.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Associated project not found." });
      return;
    }

    if (req.user.systemRole === "admin") {
      return next();
    }

    const userRole = getProjectRole(project, req.user._id.toString());
    if (!userRole) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error verifying milestone permissions.",
      error: error.message,
    });
  }
};

export const requireTaskMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ success: false, message: "Task ID is required." });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Associated project not found." });
      return;
    }

    if (req.user.systemRole === "admin") {
      return next();
    }

    const userRole = getProjectRole(project, req.user._id.toString());
    if (!userRole) {
      res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error verifying task permissions.",
      error: error.message,
    });
  }
};

export const requireTaskPermission = (action: "create" | "edit" | "status" | "delete") => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      if (req.user.systemRole === "admin") {
        return next();
      }

      let projectId = req.params.projectId || req.body.projectId;
      let task: any = null;

      if (req.params.taskId) {
        task = await Task.findById(req.params.taskId);
        if (!task) {
          res.status(404).json({ success: false, message: "Task not found." });
          return;
        }
        projectId = task.projectId;
      }

      if (!projectId) {
        res.status(400).json({ success: false, message: "Project or Task ID required." });
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({ success: false, message: "Associated project not found." });
        return;
      }

      const userRole = getProjectRole(project, req.user._id.toString());
      if (!userRole) {
        res.status(403).json({ success: false, message: "Access denied. You are not a member of this project." });
        return;
      }

      // Reviewer cannot create, edit, change status, or delete tasks
      if (userRole === "Reviewer") {
        res.status(403).json({
          success: false,
          message: "Reviewers have read-only access to tasks and cannot modify them.",
        });
        return;
      }

      // Project Owner and Project Manager can do all task actions
      if (userRole === "Project Owner" || userRole === "Project Manager") {
        return next();
      }

      // Team Member rules
      if (userRole === "Team Member") {
        if (action === "create") {
          return next();
        }

        if (action === "delete") {
          res.status(403).json({
            success: false,
            message: "Team members cannot delete tasks. Only Project Owners and Managers can delete tasks.",
          });
          return;
        }

        if (action === "status") {
          // Team member can update status
          return next();
        }

        if (action === "edit") {
          // Team members can only edit their assigned tasks and limited fields
          const isAssigned = task && task.assigneeId && task.assigneeId.toString() === req.user._id.toString();
          if (!isAssigned) {
            res.status(403).json({
              success: false,
              message: "Team members can only edit tasks assigned to them.",
            });
            return;
          }

          // Check modified fields
          const bodyKeys = Object.keys(req.body);
          const forbiddenKeys = bodyKeys.filter(
            (k) => ["title", "priority", "assigneeId", "deadline", "milestoneId", "dependencies"].includes(k)
          );

          if (forbiddenKeys.length > 0) {
            res.status(403).json({
              success: false,
              message: `Team members cannot edit: ${forbiddenKeys.join(", ")}. Only status, hours, and notes can be updated.`,
            });
            return;
          }

          return next();
        }
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error evaluating task permissions.", error: error.message });
    }
  };
};
