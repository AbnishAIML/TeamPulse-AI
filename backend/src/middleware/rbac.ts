import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { Project, ProjectRole } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";

export const requireProjectRole = (allowedRoles: ProjectRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      // System admins bypass
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

      // Project Owner check
      if (project.ownerId.toString() === req.user._id.toString()) {
        return next();
      }

      // Find user role in project members
      const member = project.members.find(
        (m) => m.userId.toString() === req.user!._id.toString()
      );

      if (!member) {
        res.status(403).json({ success: false, message: "You are not a member of this project." });
        return;
      }

      if (allowedRoles.includes(member.role)) {
        return next();
      }

      res.status(403).json({
        success: false,
        message: `Action not permitted for role '${member.role}'. Required: ${allowedRoles.join(", ")}`,
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

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.userId.toString() === req.user!._id.toString()
    );

    if (!isOwner && !isMember) {
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

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.userId.toString() === req.user!._id.toString()
    );

    if (!isOwner && !isMember) {
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

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.userId.toString() === req.user!._id.toString()
    );

    if (!isOwner && !isMember) {
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
