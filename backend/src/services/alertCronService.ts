import cron, { ScheduledTask } from "node-cron";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { Notification } from "../models/Notification.js";
import { emitToUser } from "./socketService.js";

export const checkOverdueAndBlockerAlerts = async (): Promise<number> => {
  let alertsCreated = 0;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  try {
    // 1. Check overdue tasks
    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $ne: "Done" },
      assigneeId: { $exists: true, $ne: null },
    });

    for (const task of overdueTasks) {
      if (!task.assigneeId) continue;
      const dedupKey = `overdue_${task._id}_${todayStr}`;

      try {
        const notif = await Notification.create({
          recipientId: task.assigneeId,
          projectId: task.projectId,
          taskId: task._id,
          type: "OVERDUE_ALERT",
          title: `Overdue Task Alert: ${task.title}`,
          message: `Task '${task.title}' passed its deadline on ${task.deadline?.toLocaleDateString()}. Please update progress.`,
          dedupKey,
        });
        emitToUser(task.assigneeId.toString(), "notification:new", notif);
        alertsCreated++;
      } catch (err: any) {
        // E11000 duplicate dedupKey is expected and prevented
        if (err.code !== 11000) {
          console.warn("[AlertCron] Error creating overdue notification:", err.message);
        }
      }
    }

    // 2. Check stalled blockers (> 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stalledBlockedTasks = await Task.find({
      status: "Blocked",
      "blocker.isBlocked": true,
      "blocker.reportedAt": { $lt: oneDayAgo },
    });

    for (const task of stalledBlockedTasks) {
      const project = await Project.findById(task.projectId);
      if (!project) continue;

      const leaderIds = project.members
        .filter((m) => m.role === "Project Owner" || m.role === "Project Manager")
        .map((m) => m.userId.toString());

      for (const leaderId of leaderIds) {
        const dedupKey = `stalled_blocker_${task._id}_${leaderId}_${todayStr}`;
        try {
          const notif = await Notification.create({
            recipientId: leaderId,
            projectId: task.projectId,
            taskId: task._id,
            type: "BLOCKER_ALERT",
            title: `Unresolved Blocker (>24h): ${task.title}`,
            message: `Blocker on '${task.title}' has been unresolved since ${task.blocker.reportedAt?.toLocaleDateString()}. Action required.`,
            dedupKey,
          });
          emitToUser(leaderId, "notification:new", notif);
          alertsCreated++;
        } catch (err: any) {
          if (err.code !== 11000) {
            console.warn("[AlertCron] Error creating blocker alert:", err.message);
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[AlertCron] Failed to run alert checks:", err);
  }

  return alertsCreated;
};

export const startAlertCron = (): ScheduledTask => {
  // Run once every hour at minute 0
  const task = cron.schedule("0 * * * *", async () => {
    console.log("[AlertCron] Checking for overdue tasks and stalled blockers...");
    const count = await checkOverdueAndBlockerAlerts();
    if (count > 0) {
      console.log(`[AlertCron] Generated ${count} new deduped alerts.`);
    }
  });

  return task;
};
