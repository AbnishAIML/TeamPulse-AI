import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Milestone } from "../models/Milestone.js";
import { ActivityEvent } from "../models/ActivityEvent.js";

export const getReportSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { milestoneId, assigneeId, startDate, endDate } = req.query;

    const taskQuery: any = { projectId };
    if (milestoneId && milestoneId !== "All") taskQuery.milestoneId = milestoneId;
    if (assigneeId && assigneeId !== "All") taskQuery.assigneeId = assigneeId;
    if (startDate || endDate) {
      taskQuery.createdAt = {};
      if (startDate) taskQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) taskQuery.createdAt.$lte = new Date(endDate as string);
    }

    const tasks = await Task.find(taskQuery)
      .populate("assigneeId", "name email title")
      .populate("milestoneId", "title dueDate status")
      .sort({ deadline: 1 })
      .lean();

    const milestones = await Milestone.find({ projectId }).sort({ dueDate: 1 }).lean();
    const activities = await ActivityEvent.find({ projectId }).select("_id").limit(50).lean();

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Done");
    const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
    const blockedTasks = tasks.filter((t) => t.status === "Blocked" || t.blocker?.isBlocked);
    const overdueTasks = tasks.filter((t) => t.status !== "Done" && t.deadline && new Date(t.deadline) < now);

    let totalEst = 0;
    let totalRem = 0;
    let totalAct = 0;
    tasks.forEach((t) => {
      totalEst += t.estimatedHours || 0;
      totalRem += t.remainingHours || 0;
      totalAct += t.actualHours || 0;
    });

    res.json({
      success: true,
      report: {
        totalTasks,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        blockedCount: blockedTasks.length,
        overdueCount: overdueTasks.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
        totalEstimatedHours: totalEst,
        totalRemainingHours: totalRem,
        totalActualHours: totalAct,
        tasks,
        milestones,
        recentActivityCount: activities.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to generate report summary.", error: error.message });
  }
};

/**
 * Sanitizes a value for CSV export to prevent spreadsheet formula injection (CWE-1236).
 * Escapes quotes and prefixes formula-triggering characters (=, +, -, @, \t, \r) with a single quote.
 */
const sanitizeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export const exportReportCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { type } = req.query; // "tasks" | "milestones" | "blockers"

    const project = await Project.findById(projectId).select("code").lean();
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    if (type === "milestones") {
      const milestones = await Milestone.find({ projectId }).sort({ dueDate: 1 }).lean();
      let csv = "Title,Status,Due Date,Progress,Completion Criteria\n";
      milestones.forEach((m) => {
        const criteria = (m.completionCriteria || []).join("; ");
        const dueDate = m.dueDate ? new Date(m.dueDate).toISOString().split("T")[0] : "None";
        csv += `${sanitizeCsvCell(m.title)},${sanitizeCsvCell(m.status)},${sanitizeCsvCell(dueDate)},${sanitizeCsvCell(`${m.progressPct}%`)},${sanitizeCsvCell(criteria)}\n`;
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${project.code}_milestones_report.csv"`);
      res.send(csv);
      return;
    }

    // Default to tasks CSV
    const tasks = await Task.find({ projectId })
      .populate("assigneeId", "name")
      .populate("milestoneId", "title")
      .sort({ deadline: 1 })
      .lean();

    let csv = "ID,Title,Assignee,Milestone,Priority,Status,Deadline,Est Hours,Rem Hours,Actual Hours,Blocked,Review Status\n";
    tasks.forEach((t: any) => {
      const assignee = t.assigneeId ? t.assigneeId.name : "Unassigned";
      const milestone = t.milestoneId ? t.milestoneId.title : "None";
      const deadline = t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "None";
      const isBlocked = t.blocker?.isBlocked ? "Yes" : "No";
      const reviewStatus = t.review?.status || "None";

      csv += `${sanitizeCsvCell(t._id)},${sanitizeCsvCell(t.title)},${sanitizeCsvCell(assignee)},${sanitizeCsvCell(milestone)},${sanitizeCsvCell(t.priority)},${sanitizeCsvCell(t.status)},${sanitizeCsvCell(deadline)},${t.estimatedHours || 0},${t.remainingHours || 0},${t.actualHours || 0},${sanitizeCsvCell(isBlocked)},${sanitizeCsvCell(reviewStatus)}\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${project.code}_tasks_report.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to export report CSV.", error: error.message });
  }
};
