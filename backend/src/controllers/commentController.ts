import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Comment } from "../models/Comment.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { Notification } from "../models/Notification.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject, emitToUser } from "../services/socketService.js";

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

    // Resolve @mentions for genuine project members only
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = Array.from(text.matchAll(mentionRegex), (m: RegExpMatchArray) => m[1].toLowerCase());

    if (matches.length > 0) {
      const project = await Project.findById(task.projectId, "members")
        .populate("members.userId", "name email")
        .lean();

      if (project && project.members) {
        const authorIdStr = req.user!._id.toString();
        const notifiedUsers = new Set<string>();

        for (const member of project.members) {
          const u: any = member.userId;
          if (!u || !u._id) continue;
          const uId = u._id.toString();
          if (uId === authorIdStr || notifiedUsers.has(uId)) continue;

          const memberName = (u.name || "").toLowerCase();
          const memberEmail = (u.email || "").toLowerCase();
          const firstName = memberName.split(" ")[0];

          const isMentioned = matches.some(
            (m) =>
              memberName.includes(m) ||
              memberEmail.startsWith(m) ||
              firstName === m ||
              memberEmail.split("@")[0] === m
          );

          if (isMentioned) {
            notifiedUsers.add(uId);
            try {
              const dedupKey = `mention:${task.projectId}:${task._id}:${comment._id}:${uId}`;
              const notif = await Notification.create({
                recipientId: u._id,
                projectId: task.projectId,
                taskId: task._id,
                type: "comment_added",
                dedupKey,
                title: "Mentioned in comment",
                message: `${req.user!.name} mentioned you in a comment on task '${task.title}': "${text.trim().slice(0, 100)}"`,
              });
              emitToUser(uId, "notification:new", notif);
            } catch (err: any) {
              // Ignore duplicate key collision
              if (err.code !== 11000) {
                console.warn("Failed to create mention notification:", err);
              }
            }
          }
        }
      }
    }

    emitToProject(task.projectId.toString(), "comment:added", populated);

    res.status(201).json({ success: true, comment: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to add comment.", error: error.message });
  }
};
