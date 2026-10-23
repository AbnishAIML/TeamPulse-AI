import { Response } from "express";
import path from "path";
import fs from "fs";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Attachment } from "../models/Attachment.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { emitToProject } from "../services/socketService.js";

export const getTaskAttachments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const attachments = await Attachment.find({ taskId })
      .populate("uploaderId", "name initials avatarColor")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, attachments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch attachments.", error: error.message });
  }
};

export const uploadAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: "No file was uploaded." });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const attachment = await Attachment.create({
      taskId,
      projectId: task.projectId,
      uploaderId: req.user!._id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      filePath: file.path,
    });

    const populated = await Attachment.findById(attachment._id).populate("uploaderId", "name initials avatarColor").lean();

    emitToProject(task.projectId.toString(), "attachment:added", populated);

    res.status(201).json({ success: true, attachment: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to upload file.", error: error.message });
  }
};

export const downloadAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      res.status(404).json({ success: false, message: "Attachment not found." });
      return;
    }

    // Verify access to project
    const project = await Project.findById(attachment.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Associated project not found." });
      return;
    }

    const isMember =
      req.user!.systemRole === "admin" ||
      project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m) => m.userId.toString() === req.user!._id.toString());

    if (!isMember) {
      res.status(403).json({ success: false, message: "You are not authorized to access this file." });
      return;
    }

    if (!fs.existsSync(attachment.filePath)) {
      res.status(404).json({ success: false, message: "File missing on disk." });
      return;
    }

    res.download(attachment.filePath, attachment.originalName);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to download attachment.", error: error.message });
  }
};

export const deleteAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attachmentId } = req.params;

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      res.status(404).json({ success: false, message: "Attachment not found." });
      return;
    }

    const project = await Project.findById(attachment.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Associated project not found." });
      return;
    }

    // Requester must be uploader, project owner, or project manager
    const isUploader = attachment.uploaderId.toString() === req.user!._id.toString();
    const isOwner = project.ownerId.toString() === req.user!._id.toString();
    const isManager = project.members.some(
      (m) => m.userId.toString() === req.user!._id.toString() && (m.role === "Project Owner" || m.role === "Project Manager")
    );

    if (!isUploader && !isOwner && !isManager && req.user!.systemRole !== "admin") {
      res.status(403).json({ success: false, message: "You are not authorized to delete this attachment." });
      return;
    }

    // Safely remove file on disk if present
    if (fs.existsSync(attachment.filePath)) {
      try {
        fs.unlinkSync(attachment.filePath);
      } catch (fileErr) {
        console.warn("Could not remove file on disk:", fileErr);
      }
    }

    await Attachment.findByIdAndDelete(attachmentId);

    emitToProject(attachment.projectId.toString(), "attachment:deleted", {
      attachmentId,
      taskId: attachment.taskId,
    });

    res.json({ success: true, message: "Attachment deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to delete attachment.", error: error.message });
  }
};
