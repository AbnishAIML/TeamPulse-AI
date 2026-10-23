import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { AnalyticsBridge } from "../services/analyticsBridge.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject } from "../services/socketService.js";

export const getProjectDependencies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const tasks = await Task.find({ projectId }).populate("assigneeId", "name");

    const taskPayloads = tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      status: t.status,
      priority: t.priority,
      estimated_hours: t.estimatedHours,
      remaining_hours: t.remainingHours,
      actual_hours: t.actualHours,
      start_date: t.startDate?.toISOString(),
      deadline: t.deadline?.toISOString(),
      dependencies: t.dependencies.map((d: any) => d.toString()),
      assignee_id: t.assigneeId ? (t.assigneeId as any)._id?.toString() || t.assigneeId.toString() : undefined,
      assignee_name: t.assigneeId ? (t.assigneeId as any).name : undefined,
      tags: t.tags,
      is_blocked: t.blocker?.isBlocked || false,
    }));

    const analysis = await AnalyticsBridge.analyzeDependencies(projectId, taskPayloads);

    res.json({
      success: true,
      analysis,
      tasks: taskPayloads,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to analyze dependencies.", error: error.message });
  }
};

export const addDependency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { predecessorId } = req.body;

    if (!predecessorId) {
      res.status(400).json({ success: false, message: "Predecessor task ID is required." });
      return;
    }

    if (taskId === predecessorId) {
      res.status(400).json({ success: false, message: "A task cannot depend on itself." });
      return;
    }

    const task = await Task.findById(taskId);
    const predTask = await Task.findById(predecessorId);

    if (!task || !predTask) {
      res.status(404).json({ success: false, message: "One or both tasks not found." });
      return;
    }

    if (task.dependencies.some((d) => d.toString() === predecessorId)) {
      res.status(400).json({ success: false, message: "Dependency already exists." });
      return;
    }

    // Pre-flight cycle check
    const allTasks = await Task.find({ projectId: task.projectId });
    const simulatedPayloads = allTasks.map((t) => {
      const deps = t.dependencies.map((d) => d.toString());
      if (t._id.toString() === taskId) {
        deps.push(predecessorId);
      }
      return {
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimated_hours: t.estimatedHours,
        remaining_hours: t.remainingHours,
        actual_hours: t.actualHours,
        dependencies: deps,
      };
    });

    const check = await AnalyticsBridge.analyzeDependencies(task.projectId.toString(), simulatedPayloads);
    if (check.has_cycle) {
      res.status(400).json({
        success: false,
        message: `Dependency rejected: creates a circular cycle (${check.cycle_nodes.join(" ➔ ")})`,
        cycleNodes: check.cycle_nodes,
      });
      return;
    }

    task.dependencies.push(predTask._id as any);
    await task.save();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "DEPENDENCY_ADDED",
      summary: `Added dependency: '${task.title}' now depends on '${predTask.title}'`,
    });

    emitToProject(task.projectId.toString(), "dependency:changed", {
      taskId,
      predecessorId,
      action: "added",
    });

    res.json({
      success: true,
      message: "Dependency added successfully.",
      dependencies: task.dependencies,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to add dependency.", error: error.message });
  }
};

export const removeDependency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId, predecessorId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    task.dependencies = task.dependencies.filter((d) => d.toString() !== predecessorId);
    await task.save();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "DEPENDENCY_REMOVED",
      summary: `Removed dependency from task '${task.title}'`,
    });

    emitToProject(task.projectId.toString(), "dependency:changed", {
      taskId,
      predecessorId,
      action: "removed",
    });

    res.json({
      success: true,
      message: "Dependency removed successfully.",
      dependencies: task.dependencies,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to remove dependency.", error: error.message });
  }
};
