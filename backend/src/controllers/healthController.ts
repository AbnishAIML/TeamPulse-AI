import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";
import { AnalyticsBridge } from "../services/analyticsBridge.js";

export const getProjectHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId, "members.weeklyCapacityHours").lean();
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const tasks = await Task.find(
      { projectId },
      "status deadline priority blocker.isBlocked review.status remainingHours estimatedHours"
    ).lean();
    const milestones = await Milestone.find({ projectId }, "status dueDate progressPct").lean();

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;
    
    const overdueTasks = tasks.filter((t) => t.status !== "Done" && t.deadline && new Date(t.deadline) < now);
    const overdueCritHigh = overdueTasks.filter((t) => t.priority === "High" || t.priority === "Critical").length;
    const blockedTasks = tasks.filter((t) => t.status === "Blocked" || t.blocker?.isBlocked).length;
    const pendingReviews = tasks.filter((t) => t.review?.status === "Pending Review").length;

    const overdueMilestones = milestones.filter((m) => m.status !== "Completed" && new Date(m.dueDate) < now).length;
    const atRiskMilestones = milestones.filter(
      (m) => m.status === "In Progress" && new Date(m.dueDate).getTime() - now.getTime() < 3 * 86400000 && m.progressPct < 50
    ).length;

    // Calculate approximate average utilization
    let totalRemHours = 0;
    tasks.forEach((t) => {
      if (t.status !== "Done") {
        totalRemHours += t.remainingHours || t.estimatedHours || 3;
      }
    });

    const totalCapacity = project.members.reduce((acc, m) => acc + (m.weeklyCapacityHours || 20), 0);
    const avgUtil = totalCapacity > 0 ? Math.round((totalRemHours / totalCapacity) * 100) : 75;

    const healthRequest = {
      project_id: projectId,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      overdue_tasks_count: overdueTasks.length,
      overdue_critical_high_count: overdueCritHigh,
      blocked_tasks_count: blockedTasks,
      critical_path_delayed_count: blockedTasks > 0 ? 1 : 0,
      average_utilization_pct: avgUtil,
      pending_reviews_count: pendingReviews,
      milestones_total: milestones.length,
      milestones_overdue: overdueMilestones,
      milestones_at_risk: atRiskMilestones,
    };

    const healthData = await AnalyticsBridge.evaluateProjectHealth(healthRequest);

    res.json({
      success: true,
      health: healthData,
      metrics: healthRequest,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to evaluate project health.", error: error.message });
  }
};
