import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { ActivityEvent } from "../models/ActivityEvent.js";
import { Comment } from "../models/Comment.js";
import { AnalyticsBridge } from "../services/analyticsBridge.js";

export const getProjectContributions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("members.userId", "name");
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const tasks = await Task.find({ projectId });
    const activities = await ActivityEvent.find({ projectId });
    const comments = await Comment.find({ projectId });

    const memberActivityPayloads = project.members.map((m: any) => {
      const uId = m.userId._id.toString();
      const memberTasks = tasks.filter((t) => t.assigneeId?.toString() === uId);
      const doneTasks = memberTasks.filter((t) => t.status === "Done");
      const inProgressTasks = memberTasks.filter((t) => t.status === "In Progress");

      let onTime = 0;
      let late = 0;
      let estDone = 0;
      let actLogged = 0;

      memberTasks.forEach((t) => {
        actLogged += t.actualHours || 0;
        if (t.status === "Done") {
          estDone += t.estimatedHours || 0;
          if (t.deadline && t.completedAt) {
            if (new Date(t.completedAt) <= new Date(t.deadline)) {
              onTime++;
            } else {
              late++;
            }
          } else {
            onTime++;
          }
        }
      });

      const memberActs = activities.filter((a) => a.actorId.toString() === uId);
      const blockersReported = memberActs.filter((a) => a.eventType === "BLOCKER_REPORTED").length;
      const blockersResolved = memberActs.filter((a) => a.eventType === "BLOCKER_RESOLVED").length;
      const reviewsApproved = memberActs.filter((a) => a.eventType === "REVIEW_APPROVED").length;
      const reviewsRejected = memberActs.filter((a) => a.eventType === "REVIEW_REJECTED").length;
      const reviewsConducted = reviewsApproved + reviewsRejected;
      const commentsPosted = comments.filter((c) => c.authorId.toString() === uId).length;

      return {
        user_id: uId,
        name: m.userId.name,
        tasks_assigned: memberTasks.length,
        tasks_completed: doneTasks.length,
        tasks_in_progress: inProgressTasks.length,
        estimated_hours_completed: estDone,
        actual_hours_logged: actLogged,
        reviews_conducted: reviewsConducted,
        reviews_approved: reviewsApproved,
        reviews_rejected: reviewsRejected,
        blockers_reported: blockersReported,
        blockers_resolved: blockersResolved,
        on_time_completions: onTime,
        late_completions: late,
        comments_posted: commentsPosted,
      };
    });

    const contributionData = await AnalyticsBridge.analyzeContributions(
      projectId,
      memberActivityPayloads,
      tasks.length
    );

    res.json({
      success: true,
      contributions: contributionData,
      rawMetrics: memberActivityPayloads,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to analyze contributions.", error: error.message });
  }
};

export const getProjectActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const activities = await ActivityEvent.find({ projectId })
      .populate("actorId", "name initials avatarColor")
      .populate("taskId", "title priority status")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch activity.", error: error.message });
  }
};
