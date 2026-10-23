import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project, IProjectMember, ProjectRole } from "../models/Project.js";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";
import { Invitation } from "../models/Invitation.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject } from "../services/socketService.js";

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const query =
      req.user!.systemRole === "admin"
        ? { isArchived: false }
        : {
            $or: [{ ownerId: userId }, { "members.userId": userId }],
            isArchived: false,
          };

    const projects = await Project.find(query)
      .populate("ownerId", "name email initials avatarColor")
      .populate("members.userId", "name email initials avatarColor title weeklyCapacityHours")
      .sort({ updatedAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);

    // Batch aggregate task and milestone metrics in 2 constant queries instead of 3N queries
    const [taskStats, milestoneStats] = await Promise.all([
      Task.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: "$projectId",
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
            },
          },
        },
      ]),
      Milestone.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: "$projectId",
            totalMilestones: { $sum: 1 },
          },
        },
      ]),
    ]);

    const taskStatMap = new Map(taskStats.map((s) => [s._id.toString(), s]));
    const milestoneStatMap = new Map(milestoneStats.map((s) => [s._id.toString(), s.totalMilestones]));

    const enhancedProjects = projects.map((p) => {
      const pIdStr = p._id.toString();
      const tStat = taskStatMap.get(pIdStr) || { totalTasks: 0, completedTasks: 0 };
      const mCount = milestoneStatMap.get(pIdStr) || 0;
      const totalTasks = tStat.totalTasks;
      const completedTasks = tStat.completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...p,
        totalTasks,
        completedTasks,
        totalMilestones: mCount,
        completionRate,
      };
    });

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
    const { name, code, description, objectives, startDate, targetDeadline, settings } = req.body;

    if (!name || !targetDeadline) {
      res.status(400).json({ success: false, message: "Project name and target deadline are required." });
      return;
    }

    const generatedCode = (code || name.replace(/[^A-Za-z0-9]/g, "").slice(0, 5)).toUpperCase();

    const project = await Project.create({
      name: name.trim(),
      code: generatedCode,
      description: description || "",
      objectives: Array.isArray(objectives) ? objectives : [],
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDeadline: new Date(targetDeadline),
      ownerId: req.user!._id,
      settings: settings || {
        requireReviewForDone: false,
        productiveHoursPerDay: 6,
        workingDays: [1, 2, 3, 4, 5],
        overloadThresholdPct: 100,
        underloadThresholdPct: 40,
      },
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
    const { name, description, objectives, startDate, targetDeadline, status, settings } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (objectives && Array.isArray(objectives)) project.objectives = objectives;
    if (startDate) project.startDate = new Date(startDate);
    if (targetDeadline) project.targetDeadline = new Date(targetDeadline);
    if (status) project.status = status;
    if (settings && typeof settings === "object") {
      project.settings = { ...project.settings, ...settings };
    }

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

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
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

    // Last-owner protection
    if (member.role === "Project Owner" && role && role !== "Project Owner") {
      const ownerCount = project.members.filter((m) => m.role === "Project Owner").length;
      if (ownerCount <= 1) {
        res.status(400).json({
          success: false,
          message: "Cannot demote the only Project Owner. Assign another owner first.",
        });
        return;
      }
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

    // Last-owner protection: cannot remove owner if they are the only owner or the project ownerId
    const targetMember = project.members.find((m) => m.userId.toString() === memberId);
    if (!targetMember) {
      res.status(404).json({ success: false, message: "Member not found in project." });
      return;
    }

    if (targetMember.role === "Project Owner" || project.ownerId.toString() === memberId) {
      const ownerCount = project.members.filter((m) => m.role === "Project Owner").length;
      if (ownerCount <= 1) {
        res.status(400).json({
          success: false,
          message: "Cannot remove the only Project Owner of the project.",
        });
        return;
      }
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

// ==================== INVITATIONS ====================

export const createInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required to invite a collaborator." });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const isMember = project.members.some(
        (m) => m.userId.toString() === existingUser._id.toString()
      );
      if (isMember) {
        res.status(400).json({ success: false, message: "User is already a member of this project." });
        return;
      }
    }

    // Invalidate any existing pending invitation for this email on this project
    await Invitation.updateMany(
      { projectId: project._id, email: cleanEmail, status: "pending" },
      { $set: { status: "expired" } }
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      token,
      projectId: project._id,
      email: cleanEmail,
      role: (role as ProjectRole) || "Team Member",
      inviterId: req.user!._id,
      expiresAt,
      status: "pending",
    });

    const inviteLink = `${req.headers.origin || "http://localhost:5173"}/invite?token=${token}`;

    res.status(201).json({
      success: true,
      invitation,
      inviteLink,
      message: `Invitation created for ${cleanEmail}. Share the link to grant access.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create invitation.", error: error.message });
  }
};

export const getInvitations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const invitations = await Invitation.find({
      projectId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("inviterId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch invitations.", error: error.message });
  }
};

export const revokeInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, invitationId } = req.params;

    const invitation = await Invitation.findOne({
      _id: invitationId,
      projectId,
      status: "pending",
    });

    if (!invitation) {
      res.status(404).json({ success: false, message: "Pending invitation not found." });
      return;
    }

    invitation.status = "revoked";
    await invitation.save();

    res.json({ success: true, message: "Invitation revoked successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to revoke invitation.", error: error.message });
  }
};

export const regenerateInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, invitationId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const invitation = await Invitation.findOne({ _id: invitationId, projectId });
    if (!invitation) {
      res.status(404).json({ success: false, message: "Invitation not found." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    invitation.token = token;
    invitation.expiresAt = expiresAt;
    invitation.status = "pending";
    await invitation.save();

    const inviteLink = `${req.headers.origin || "http://localhost:5173"}/invite?token=${token}`;

    res.json({
      success: true,
      invitation,
      inviteLink,
      message: `Invitation regenerated for ${invitation.email}. Share the link to grant access.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to regenerate invitation.", error: error.message });
  }
};

export const acceptInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: "Invitation token is required." });
      return;
    }

    const invitation = await Invitation.findOne({ token, status: "pending" });
    if (!invitation) {
      res.status(404).json({ success: false, message: "Invalid or already used invitation token." });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      res.status(400).json({ success: false, message: "Invitation has expired. Please request a new one." });
      return;
    }

    const project = await Project.findById(invitation.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project associated with invitation no longer exists." });
      return;
    }

    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === req.user!._id.toString()
    );

    if (alreadyMember) {
      invitation.status = "accepted";
      await invitation.save();
      res.json({
        success: true,
        message: "You are already a member of this project.",
        project,
      });
      return;
    }

    project.members.push({
      userId: req.user!._id,
      role: invitation.role,
      joinedAt: new Date(),
      weeklyCapacityHours: req.user!.weeklyCapacityHours || 20,
    });

    await project.save();

    invitation.status = "accepted";
    await invitation.save();

    await logActivity({
      projectId: project._id,
      actorId: req.user!._id,
      eventType: "WORKLOAD_REBALANCED",
      summary: `${req.user!.name} accepted invitation and joined as '${invitation.role}'`,
    });

    emitToProject(project._id.toString(), "project:members_updated", project.members);

    res.json({
      success: true,
      message: `Successfully joined ${project.name} as ${invitation.role}!`,
      project,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to accept invitation.", error: error.message });
  }
};
