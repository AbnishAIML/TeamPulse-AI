import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project, IProjectMember } from "../models/Project.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject } from "../services/socketService.js";

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const query = req.user!.systemRole === "admin"
      ? { isArchived: false }
      : {
          $or: [{ ownerId: userId }, { "members.userId": userId }],
          isArchived: false,
        };

    const projects = await Project.find(query)
      .populate("ownerId", "name email initials avatarColor")
      .populate("members.userId", "name email initials avatarColor title weeklyCapacityHours")
      .sort({ updatedAt: -1 });

    // Attach summary counts
    const enhancedProjects = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ projectId: p._id });
        const completedTaskCount = await Task.countDocuments({ projectId: p._id, status: "Done" });
        const milestoneCount = await Milestone.countDocuments({ projectId: p._id });

        return {
          ...p.toObject(),
          totalTasks: taskCount,
          completedTasks: completedTaskCount,
          totalMilestones: milestoneCount,
          completionRate: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
        };
      })
    );

    res.json({ success: true, projects: enhancedProjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch projects.", error: error.message });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("ownerId", "name email initials avatarColor")
      .populate("members.userId", "name email initials avatarColor title weeklyCapacityHours skills");

    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    const milestones = await Milestone.find({ projectId }).sort({ dueDate: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;
    const blockedTasks = tasks.filter((t) => t.status === "Blocked" || t.blocker?.isBlocked).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      project: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        blockedTasks,
        completionRate,
      },
      tasks,
      milestones,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch project details.", error: error.message });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description, objectives, startDate, targetDeadline } = req.body;

    if (!name || !targetDeadline) {
      res.status(400).json({ success: false, message: "Project name and target deadline are required." });
      return;
    }

    const generatedCode = (code || name.replace(/[^A-Za-z0-9]/g, "").slice(0, 5)).toUpperCase();

    const project = await Project.create({
      name,
      code: generatedCode,
      description: description || "",
      objectives: Array.isArray(objectives) ? objectives : [],
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDeadline: new Date(targetDeadline),
      ownerId: req.user!._id,
      members: [
        {
          userId: req.user!._id,
          role: "Project Owner",
          joinedAt: new Date(),
          weeklyCapacityHours: req.user!.weeklyCapacityHours || 20,
        },
      ],
    });

    await logActivity({
      projectId: project._id,
      actorId: req.user!._id,
      eventType: "WORKLOAD_REBALANCED",
      summary: `Project '${project.name}' created by ${req.user!.name}`,
    });

    res.status(201).json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create project.", error: error.message });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, description, objectives, startDate, targetDeadline, status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (objectives && Array.isArray(objectives)) project.objectives = objectives;
    if (startDate) project.startDate = new Date(startDate);
    if (targetDeadline) project.targetDeadline = new Date(targetDeadline);
    if (status) project.status = status;

    await project.save();
    emitToProject(projectId, "project:updated", project);

    res.json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update project.", error: error.message });
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { email, role, weeklyCapacityHours } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "User email is required." });
      return;
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      res.status(404).json({ success: false, message: `No user found with email ${email}.` });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      res.status(400).json({ success: false, message: "User is already a member of this project." });
      return;
    }

    project.members.push({
      userId: userToAdd._id as any,
      role: role || "Team Member",
      joinedAt: new Date(),
      weeklyCapacityHours: weeklyCapacityHours || userToAdd.weeklyCapacityHours || 20,
    });

    await project.save();

    await logActivity({
      projectId: project._id,
      actorId: req.user!._id,
      eventType: "WORKLOAD_REBALANCED",
      summary: `${userToAdd.name} added to project with role '${role || "Team Member"}'`,
    });

    emitToProject(projectId, "project:members_updated", project.members);

    res.json({ success: true, message: "Member added successfully.", members: project.members });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to add member.", error: error.message });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, memberId } = req.params;
    const { role, weeklyCapacityHours } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const member = project.members.find((m) => m.userId.toString() === memberId);
    if (!member) {
      res.status(404).json({ success: false, message: "Member not found in this project." });
      return;
    }

    if (role) member.role = role;
    if (weeklyCapacityHours !== undefined) member.weeklyCapacityHours = Number(weeklyCapacityHours);

    await project.save();
    emitToProject(projectId, "project:members_updated", project.members);

    res.json({ success: true, message: "Member updated successfully.", member });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update member.", error: error.message });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    if (project.ownerId.toString() === memberId) {
      res.status(400).json({ success: false, message: "Cannot remove the Project Owner." });
      return;
    }

    project.members = project.members.filter((m) => m.userId.toString() !== memberId);
    await project.save();

    emitToProject(projectId, "project:members_updated", project.members);

    res.json({ success: true, message: "Member removed from project." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to remove member.", error: error.message });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    project.isArchived = true;
    await project.save();

    res.json({ success: true, message: "Project archived successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete project.", error: error.message });
  }
};
