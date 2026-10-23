import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Milestone } from "../models/Milestone.js";
import { Task } from "../models/Task.js";
import { emitToProject } from "../services/socketService.js";

export const getMilestones = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const milestones = await Milestone.find({ projectId }).sort({ dueDate: 1 });

    const enriched = await Promise.all(
      milestones.map(async (m) => {
        const tasks = await Task.find({ milestoneId: m._id });
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "Done").length;
        const calculatedProgress = total > 0 ? Math.round((done / total) * 100) : m.progressPct;

        // Auto update progress in db if changed
        if (calculatedProgress !== m.progressPct && total > 0) {
          m.progressPct = calculatedProgress;
          if (calculatedProgress === 100) {
            m.status = "Completed";
            m.completedAt = new Date();
          } else if (new Date(m.dueDate) < new Date()) {
            m.status = "Overdue";
          } else {
            m.status = "In Progress";
          }
          await m.save();
        }

        return {
          ...m.toObject(),
          totalTasks: total,
          completedTasks: done,
          calculatedProgress,
          isOverdue: new Date(m.dueDate) < new Date() && m.status !== "Completed",
        };
      })
    );

    res.json({ success: true, milestones: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch milestones.", error: error.message });
  }
};

export const createMilestone = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, dueDate, completionCriteria } = req.body;

    if (!title || !dueDate) {
      res.status(400).json({ success: false, message: "Milestone title and due date are required." });
      return;
    }

    const milestone = await Milestone.create({
      projectId,
      title,
      description: description || "",
      dueDate: new Date(dueDate),
      completionCriteria: Array.isArray(completionCriteria) ? completionCriteria : [],
      status: "Planning",
      progressPct: 0,
    });

    emitToProject(projectId, "milestone:created", milestone);

    res.status(201).json({ success: true, milestone });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to create milestone.", error: error.message });
  }
};

export const updateMilestone = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    const { title, description, dueDate, completionCriteria, status } = req.body;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: "Milestone not found." });
      return;
    }

    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (dueDate) milestone.dueDate = new Date(dueDate);
    if (completionCriteria && Array.isArray(completionCriteria)) milestone.completionCriteria = completionCriteria;
    if (status) {
      milestone.status = status;
      if (status === "Completed") milestone.completedAt = new Date();
    }

    await milestone.save();
    emitToProject(milestone.projectId.toString(), "milestone:updated", milestone);

    res.json({ success: true, milestone });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update milestone.", error: error.message });
  }
};

export const deleteMilestone = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: "Milestone not found." });
      return;
    }

    const projectId = milestone.projectId.toString();
    await Task.updateMany({ milestoneId }, { $unset: { milestoneId: 1 } });
    await Milestone.findByIdAndDelete(milestoneId);

    emitToProject(projectId, "milestone:deleted", { milestoneId });

    res.json({ success: true, message: "Milestone deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete milestone.", error: error.message });
  }
};
