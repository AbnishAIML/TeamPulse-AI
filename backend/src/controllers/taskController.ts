import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Task, TaskStatus } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { Milestone } from "../models/Milestone.js";
import { Notification } from "../models/Notification.js";
import { TaskDependency } from "../models/TaskDependency.js";
import { Review } from "../models/Review.js";
import { Blocker } from "../models/Blocker.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject, emitToUser } from "../services/socketService.js";

const VALID_STATUSES: TaskStatus[] = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Blocked",
  "Done",
];

const syncMilestoneProgress = async (milestoneId?: any): Promise<void> => {
  if (!milestoneId) return;
  try {
    const tasks = await Task.find({ milestoneId });
    const total = tasks.length;
    if (total === 0) return;

    const done = tasks.filter((t) => t.status === "Done").length;
    const progressPct = Math.round((done / total) * 100);

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) return;

    milestone.progressPct = progressPct;
    if (progressPct === 100) {
      milestone.status = "Completed";
      milestone.completedAt = new Date();
    } else if (new Date(milestone.dueDate) < new Date()) {
      milestone.status = "Overdue";
    } else {
      milestone.status = "In Progress";
    }

    await milestone.save();
    emitToProject(milestone.projectId.toString(), "milestone:updated", milestone);
  } catch (err) {
    console.warn("Failed to sync milestone progress:", err);
  }
};

const getPredecessorTasks = async (taskId: string, explicitDeps: any[] = []): Promise<any[]> => {
  const depDocs = await TaskDependency.find({ successorId: taskId });
  const allPredIds = Array.from(
    new Set([
      ...explicitDeps.map((d: any) => d._id?.toString() || d.toString()),
      ...depDocs.map((d) => d.predecessorId.toString()),
    ])
  );
  if (allPredIds.length === 0) return [];
  return Task.find({ _id: { $in: allPredIds } });
};

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

    // Find successor tasks
    const successors = await Task.find(
      { dependencies: task._id },
      "title status priority deadline assigneeId"
    ).populate("assigneeId", "name initials avatarColor");

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

    const initialStatus: TaskStatus = status || "To Do";
    if (!VALID_STATUSES.includes(initialStatus)) {
      res.status(422).json({
        success: false,
        message: `Invalid status '${initialStatus}'. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const task = await Task.create({
      projectId,
      title: title.trim(),
      description: description || "",
      assigneeId: assigneeId || undefined,
      milestoneId: milestoneId || undefined,
      priority: priority || "Medium",
      status: initialStatus,
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 4,
      remainingHours: estimatedHours ? Number(estimatedHours) : 4,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    // Sync dependencies into TaskDependency collection
    if (Array.isArray(dependencies) && dependencies.length > 0) {
      for (const predId of dependencies) {
        await TaskDependency.findOneAndUpdate(
          { projectId, predecessorId: predId, successorId: task._id },
          { projectId, predecessorId: predId, successorId: task._id },
          { upsert: true }
        );
      }
    }

    await syncMilestoneProgress(task.milestoneId);

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

    // Check status transition validity if status is being updated
    if (updates.status && updates.status !== task.status) {
      const newStatus: TaskStatus = updates.status;
      if (!VALID_STATUSES.includes(newStatus)) {
        res.status(422).json({
          success: false,
          message: `Invalid status '${newStatus}'. Allowed: ${VALID_STATUSES.join(", ")}`,
        });
        return;
      }

      // Predecessor check for In Progress
      if (newStatus === "In Progress") {
        const predecessors = await getPredecessorTasks(taskId, task.dependencies);
        const blockedPred = predecessors.find((p) => p.status !== "Done");
        if (blockedPred) {
          res.status(422).json({
            success: false,
            message: `Cannot start task: blocked by predecessor task '${blockedPred.title}'`,
          });
          return;
        }
      }

      // Done transition checks
      if (newStatus === "Done") {
        const predecessors = await getPredecessorTasks(taskId, task.dependencies);
        const unfinished = predecessors.find((p) => p.status !== "Done");
        if (unfinished) {
          res.status(422).json({
            success: false,
            message: `Finish-to-Start dependency violation: Predecessor task '${unfinished.title}' is not yet completed.`,
          });
          return;
        }

        const project = await Project.findById(task.projectId);
        if (project?.settings?.requireReviewForDone) {
          const approvedReview =
            task.review?.status === "Approved" ||
            (await Review.findOne({ taskId: task._id, status: "Approved" }));
          if (!approvedReview) {
            res.status(422).json({
              success: false,
              message: "Review required: Task requires approved review before moving to Done",
            });
            return;
          }
        }

        task.remainingHours = 0;
        task.completedAt = new Date();
        if (task.blocker?.isBlocked) {
          task.blocker.isBlocked = false;
          task.blocker.resolvedAt = new Date();
        }
      }

      task.status = newStatus;
    }

    const previousAssignee = task.assigneeId?.toString();
    const oldMilestoneId = task.milestoneId?.toString();

    if (updates.title) task.title = updates.title.trim();
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

    await syncMilestoneProgress(task.milestoneId);
    if (oldMilestoneId && oldMilestoneId !== task.milestoneId?.toString()) {
      await syncMilestoneProgress(oldMilestoneId);
    }

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

    if (!VALID_STATUSES.includes(status)) {
      res.status(422).json({
        success: false,
        message: `Invalid status '${status}'. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    // Rule: Transition into In Progress requires all finish-to-start predecessors to be Done
    if (status === "In Progress") {
      const predecessors = await getPredecessorTasks(taskId, task.dependencies);
      const blockedPred = predecessors.find((p) => p.status !== "Done");
      if (blockedPred) {
        res.status(422).json({
          success: false,
          message: `Cannot start task: blocked by predecessor task '${blockedPred.title}'`,
        });
        return;
      }
    }

    // Rule: Transition into Done
    if (status === "Done") {
      // Check for unfinished dependencies (predecessors)
      const predecessors = await getPredecessorTasks(taskId, task.dependencies);
      const unfinishedPred = predecessors.find((d) => d.status !== "Done");
      if (unfinishedPred) {
        res.status(422).json({
          success: false,
          message: `Finish-to-Start dependency violation: Predecessor task '${unfinishedPred.title}' is not yet completed.`,
        });
        return;
      }

      // Check quality gate: requireReviewForDone
      const project = await Project.findById(task.projectId);
      if (project?.settings?.requireReviewForDone) {
        const approvedReview =
          task.review?.status === "Approved" ||
          (await Review.findOne({ taskId: task._id, status: "Approved" }));
        if (!approvedReview) {
          res.status(422).json({
            success: false,
            message: "Review required: Task requires approved peer review before moving to Done",
          });
          return;
        }
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

    await syncMilestoneProgress(task.milestoneId);

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

    await Blocker.create({
      taskId: task._id,
      projectId: task.projectId,
      reportedBy: req.user!._id,
      severity: severity || "High",
      description: reason || "Unspecified blocker",
      status: "Open",
    });

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

    await Blocker.findOneAndUpdate(
      { taskId: task._id, status: "Open" },
      { status: "Resolved", resolvedBy: req.user!._id, resolvedAt: new Date() }
    );

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
    const milestoneId = task.milestoneId?.toString();

    // Remove dependency references
    await Task.updateMany({ dependencies: taskId }, { $pull: { dependencies: taskId } });
    await TaskDependency.deleteMany({
      $or: [{ predecessorId: taskId }, { successorId: taskId }],
    });

    await Task.findByIdAndDelete(taskId);

    if (milestoneId) {
      await syncMilestoneProgress(milestoneId);
    }

    emitToProject(projectId, "task:deleted", { taskId });

    res.json({ success: true, message: "Task deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete task.", error: error.message });
  }
};
