import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Comment } from "../models/Comment.js";
import { Task } from "../models/Task.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject } from "../services/socketService.js";

export const getTaskComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId })
      .populate("authorId", "name initials avatarColor title")
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch comments.", error: error.message });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: "Comment text cannot be empty." });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const comment = await Comment.create({
      taskId,
      projectId: task.projectId,
      authorId: req.user!._id,
      text: text.trim(),
    });

    const populated = await Comment.findById(comment._id).populate("authorId", "name initials avatarColor title").lean();

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "COMMENT_ADDED",
      summary: `Comment added on '${task.title}' by ${req.user!.name}`,
    });

    emitToProject(task.projectId.toString(), "comment:added", populated);

    res.status(201).json({ success: true, comment: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to add comment.", error: error.message });
  }
};
