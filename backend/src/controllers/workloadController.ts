import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { AnalyticsBridge } from "../services/analyticsBridge.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject, emitToUser } from "../services/socketService.js";

export const getProjectWorkload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("members.userId", "name weeklyCapacityHours skills");
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const tasks = await Task.find({ projectId }).populate("assigneeId", "name");

    const membersPayload = project.members.map((m: any) => ({
      user_id: m.userId._id.toString(),
      name: m.userId.name,
      weekly_capacity_hours: m.weeklyCapacityHours || m.userId.weeklyCapacityHours || 20,
      skills: m.userId.skills || [],
      project_role: m.role,
    }));

    const tasksPayload = tasks.map((t: any) => ({
      id: t._id.toString(),
      title: t.title,
      assignee_id: t.assigneeId ? t.assigneeId._id.toString() : undefined,
      assignee_name: t.assigneeId ? t.assigneeId.name : undefined,
      status: t.status,
      priority: t.priority,
      estimated_hours: t.estimatedHours,
      remaining_hours: t.remainingHours,
      actual_hours: t.actualHours,
      deadline: t.deadline?.toISOString(),
      tags: t.tags,
      is_blocked: t.blocker?.isBlocked || false,
      dependencies: t.dependencies.map((d: any) => d.toString()),
    }));

    const workloadData = await AnalyticsBridge.analyzeWorkload(projectId, membersPayload, tasksPayload);

    res.json({
      success: true,
      workload: workloadData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to analyze workload.", error: error.message });
  }
};

export const applyRedistribution = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { taskId, proposedAssigneeId, reason } = req.body;

    if (!taskId || !proposedAssigneeId) {
      res.status(400).json({ success: false, message: "Task ID and proposed assignee ID are required." });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const proposedUser = await User.findById(proposedAssigneeId);
    if (!proposedUser) {
      res.status(404).json({ success: false, message: "Proposed assignee not found." });
      return;
    }

    const previousAssigneeId = task.assigneeId;
    task.assigneeId = proposedUser._id as any;
    await task.save();

    await logActivity({
      projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "WORKLOAD_REBALANCED",
      summary: `Workload Rebalanced: '${task.title}' reassigned to ${proposedUser.name}. Reason: ${reason || "Workload capacity optimization"}`,
    });

    const notif = await Notification.create({
      recipientId: proposedUser._id,
      projectId,
      taskId: task._id,
      type: "WORKLOAD_ALERT",
      title: "Task Rebalanced to You",
      message: `Task '${task.title}' was reassigned to you to optimize team workload.`,
    });
    emitToUser(proposedUser._id.toString(), "notification:new", notif);

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(projectId, "task:updated", populated);
    emitToProject(projectId, "workload:rebalanced", { taskId, newAssignee: proposedUser.name });

    res.json({
      success: true,
      message: `Successfully rebalanced task to ${proposedUser.name}`,
      task: populated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to apply redistribution.", error: error.message });
  }
};
