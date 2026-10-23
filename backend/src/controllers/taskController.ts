import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Task, TaskStatus } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { Notification } from "../models/Notification.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject, emitToUser } from "../services/socketService.js";

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, assigneeId, milestoneId, priority, search } = req.query;

    const filter: any = { projectId };

    if (status && status !== "All") {
      filter.status = status;
    }
    if (assigneeId && assigneeId !== "All") {
      filter.assigneeId = assigneeId;
    }
    if (milestoneId && milestoneId !== "All") {
      filter.milestoneId = milestoneId;
    }
    if (priority && priority !== "All") {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate("assigneeId", "name email initials avatarColor title")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline priority")
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks.", error: error.message });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assigneeId", "name email initials avatarColor title")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline priority assigneeId")
      .populate("blocker.reportedBy", "name initials avatarColor")
      .populate("review.reviewerId", "name initials avatarColor");

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    // Find successor tasks (tasks that have this task in their dependencies)
    const successors = await Task.find({ dependencies: task._id }, "title status priority deadline assigneeId")
      .populate("assigneeId", "name initials avatarColor");

    res.json({ success: true, task, successors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch task.", error: error.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      assigneeId,
      milestoneId,
      priority,
      status,
      startDate,
      deadline,
      estimatedHours,
      dependencies,
      tags,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: "Task title is required." });
      return;
    }

    const task = await Task.create({
      projectId,
      title,
      description: description || "",
      assigneeId: assigneeId || undefined,
      milestoneId: milestoneId || undefined,
      priority: priority || "Medium",
      status: status || "To Do",
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 4,
      remainingHours: estimatedHours ? Number(estimatedHours) : 4,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    await logActivity({
      projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "TASK_CREATED",
      summary: `Created task '${task.title}'`,
    });

    if (assigneeId && assigneeId !== req.user!._id.toString()) {
      const notif = await Notification.create({
        recipientId: assigneeId,
        projectId,
        taskId: task._id,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `You were assigned to task '${task.title}' by ${req.user!.name}`,
      });
      emitToUser(assigneeId, "notification:new", notif);
    }

    emitToProject(projectId, "task:created", populatedTask);

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create task.", error: error.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const previousAssignee = task.assigneeId?.toString();

    if (updates.title) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.priority) task.priority = updates.priority;
    if (updates.startDate) task.startDate = new Date(updates.startDate);
    if (updates.deadline) task.deadline = new Date(updates.deadline);
    if (updates.estimatedHours !== undefined) task.estimatedHours = Number(updates.estimatedHours);
    if (updates.remainingHours !== undefined) task.remainingHours = Number(updates.remainingHours);
    if (updates.actualHours !== undefined) task.actualHours = Number(updates.actualHours);
    if (updates.tags && Array.isArray(updates.tags)) task.tags = updates.tags;
    if (updates.milestoneId !== undefined) task.milestoneId = updates.milestoneId || undefined;
    if (updates.dependencies && Array.isArray(updates.dependencies)) {
      // Prevent self dependency
      task.dependencies = updates.dependencies.filter((d: string) => d !== taskId);
    }

    if (updates.assigneeId !== undefined) {
      task.assigneeId = updates.assigneeId || undefined;
      if (updates.assigneeId && updates.assigneeId !== previousAssignee) {
        await logActivity({
          projectId: task.projectId,
          taskId: task._id,
          actorId: req.user!._id,
          eventType: "TASK_REASSIGNED",
          summary: `Reassigned task '${task.title}'`,
        });

        const notif = await Notification.create({
          recipientId: updates.assigneeId,
          projectId: task.projectId,
          taskId: task._id,
          type: "TASK_ASSIGNED",
          title: "Task Reassigned",
          message: `Task '${task.title}' was reassigned to you.`,
        });
        emitToUser(updates.assigneeId, "notification:new", notif);
      }
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(task.projectId.toString(), "task:updated", populated);

    res.json({ success: true, task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update task.", error: error.message });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body as { status: TaskStatus };

    const task = await Task.findById(taskId).populate("dependencies");
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    // State transition validation rule:
    // If marking as Done, check if review was required and changes are requested or review is pending
    if (status === "Done") {
      if (task.review?.status === "Pending Review") {
        res.status(400).json({
          success: false,
          message: "Cannot mark task as Done: Task is currently awaiting review sign-off.",
        });
        return;
      }
      if (task.review?.status === "Changes Requested") {
        res.status(400).json({
          success: false,
          message: "Cannot mark task as Done: Changes were requested during review and have not been re-approved.",
        });
        return;
      }

      // Check for unfinished dependencies
      const unfinishedPreds = (task.dependencies as any[]).filter((d) => d.status !== "Done");
      if (unfinishedPreds.length > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot mark task as Done: Predecessor task '${unfinishedPreds[0].title}' is not yet completed.`,
        });
        return;
      }

      task.remainingHours = 0;
      task.completedAt = new Date();
      if (task.blocker?.isBlocked) {
        task.blocker.isBlocked = false;
        task.blocker.resolvedAt = new Date();
      }
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: status === "Done" ? "TASK_COMPLETED" : "STATUS_CHANGED",
      summary: `Changed status of '${task.title}' from ${previousStatus} to ${status}`,
    });

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(task.projectId.toString(), "task:status_changed", populated);

    res.json({ success: true, task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update task status.", error: error.message });
  }
};

export const reportBlocker = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { reason, severity } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    task.status = "Blocked";
    task.blocker = {
      isBlocked: true,
      reason: reason || "Unspecified blocker",
      severity: severity || "High",
      reportedBy: req.user!._id,
      reportedAt: new Date(),
    };

    await task.save();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "BLOCKER_REPORTED",
      summary: `Blocker reported on '${task.title}': ${reason}`,
    });

    // Notify project owner and manager
    const project = await Project.findById(task.projectId);
    if (project) {
      const leaderIds = project.members
        .filter((m) => m.role === "Project Owner" || m.role === "Project Manager")
        .map((m) => m.userId.toString());

      for (const leaderId of leaderIds) {
        if (leaderId !== req.user!._id.toString()) {
          const notif = await Notification.create({
            recipientId: leaderId,
            projectId: task.projectId,
            taskId: task._id,
            type: "BLOCKER_ALERT",
            title: `Blocker on ${task.title}`,
            message: `${req.user!.name} reported a ${severity || "High"} severity blocker: "${reason}"`,
          });
          emitToUser(leaderId, "notification:new", notif);
        }
      }
    }

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(task.projectId.toString(), "task:updated", populated);

    res.json({ success: true, task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to report blocker.", error: error.message });
  }
};

export const resolveBlocker = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    task.blocker.isBlocked = false;
    task.blocker.resolvedAt = new Date();
    task.status = "In Progress";

    await task.save();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "BLOCKER_RESOLVED",
      summary: `Resolved blocker on '${task.title}'`,
    });

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(task.projectId.toString(), "task:updated", populated);

    res.json({ success: true, task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to resolve blocker.", error: error.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const projectId = task.projectId.toString();
    // Remove dependency references in other tasks
    await Task.updateMany({ dependencies: taskId }, { $pull: { dependencies: taskId } });
    await Task.findByIdAndDelete(taskId);

    emitToProject(projectId, "task:deleted", { taskId });

    res.json({ success: true, message: "Task deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete task.", error: error.message });
  }
};
