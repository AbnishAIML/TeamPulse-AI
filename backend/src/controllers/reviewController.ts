import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Task } from "../models/Task.js";
import { Notification } from "../models/Notification.js";
import { Project } from "../models/Project.js";
import { Milestone } from "../models/Milestone.js";
import { Review } from "../models/Review.js";
import { logActivity } from "../services/activityService.js";
import { emitToProject, emitToUser } from "../services/socketService.js";

export const requestReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    task.status = "In Review";
    task.review = {
      status: "Pending Review",
      feedback: notes || "",
      requestedAt: new Date(),
    };

    await task.save();

    await Review.create({
      taskId: task._id,
      projectId: task.projectId,
      requestedBy: req.user!._id,
      status: "Pending Review",
      notes: notes || "",
      requestedAt: new Date(),
    });

    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType: "REVIEW_REQUESTED",
      summary: `Review requested for '${task.title}' by ${req.user!.name}`,
    });

    // Notify project reviewers & managers
    const project = await Project.findById(task.projectId, "members").lean();
    if (project) {
      const reviewers = project.members
        .filter((m) => m.role === "Reviewer" || m.role === "Project Manager" || m.role === "Project Owner")
        .map((m) => m.userId.toString());

      for (const revId of reviewers) {
        if (revId !== req.user!._id.toString()) {
          const notif = await Notification.create({
            recipientId: revId,
            projectId: task.projectId,
            taskId: task._id,
            type: "REVIEW_REQUEST",
            title: "Review Requested",
            message: `${req.user!.name} requested review for '${task.title}'`,
          });
          emitToUser(revId, "notification:new", notif);
        }
      }
    }

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline");

    emitToProject(task.projectId.toString(), "task:updated", populated);

    res.json({ success: true, message: "Review requested successfully.", task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to request review.", error: error.message });
  }
};

export const reviewDecision = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { decision, feedback } = req.body; // decision: "Approved" | "Changes Requested"

    if (!["Approved", "Changes Requested"].includes(decision)) {
      res.status(400).json({
        success: false,
        message: "Invalid review decision. Must be 'Approved' or 'Changes Requested'.",
      });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found." });
      return;
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: "Associated project not found." });
      return;
    }

    const member = project.members.find((m) => m.userId.toString() === req.user!._id.toString());
    const isOwner = project.ownerId.toString() === req.user!._id.toString();
    const canReview =
      req.user!.systemRole === "admin" ||
      isOwner ||
      (member && ["Reviewer", "Project Manager", "Project Owner"].includes(member.role));

    if (!canReview) {
      res.status(403).json({
        success: false,
        message: "Only Reviewers, Project Managers, and Project Owners can submit review decisions.",
      });
      return;
    }

    task.review = {
      status: decision,
      reviewerId: req.user!._id,
      feedback: feedback || "",
      requestedAt: task.review?.requestedAt,
      reviewedAt: new Date(),
    };

    if (decision === "Approved") {
      task.status = "Done";
      task.remainingHours = 0;
      task.completedAt = new Date();
    } else {
      task.status = "In Progress";
    }

    await task.save();

    if (task.milestoneId) {
      try {
        const tasks = await Task.find({ milestoneId: task.milestoneId });
        const total = tasks.length;
        if (total > 0) {
          const done = tasks.filter((t) => t.status === "Done").length;
          const progressPct = Math.round((done / total) * 100);
          const milestone = await Milestone.findById(task.milestoneId);
          if (milestone) {
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
          }
        }
      } catch (err) {
        console.warn("Failed to sync milestone progress:", err);
      }
    }

    await Review.findOneAndUpdate(
      { taskId: task._id, status: "Pending Review" },
      {
        reviewer: req.user!._id,
        status: decision,
        feedback: feedback || "",
        decidedAt: new Date(),
      },
      { sort: { requestedAt: -1 } }
    );

    const eventType = decision === "Approved" ? "REVIEW_APPROVED" : "REVIEW_REJECTED";
    await logActivity({
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      eventType,
      summary: `Review ${decision.toLowerCase()} for '${task.title}' by ${req.user!.name}. Feedback: "${feedback || "None"}"`,
    });

    if (task.assigneeId) {
      const notif = await Notification.create({
        recipientId: task.assigneeId,
        projectId: task.projectId,
        taskId: task._id,
        type: "REVIEW_RESULT",
        title: `Review ${decision}: ${task.title}`,
        message: `${req.user!.name} ${decision.toLowerCase()} your deliverable. Feedback: ${feedback || "Approved without notes."}`,
      });
      emitToUser(task.assigneeId.toString(), "notification:new", notif);
    }

    const populated = await Task.findById(task._id)
      .populate("assigneeId", "name email initials avatarColor")
      .populate("milestoneId", "title dueDate status")
      .populate("dependencies", "title status deadline")
      .populate("review.reviewerId", "name initials avatarColor")
      .lean();

    emitToProject(task.projectId.toString(), "task:updated", populated);

    res.json({ success: true, message: `Review ${decision.toLowerCase()} successfully.`, task: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to submit review decision.", error: error.message });
  }
};
