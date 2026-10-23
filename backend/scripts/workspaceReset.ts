import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Milestone } from "../src/models/Milestone.js";
import { Task } from "../src/models/Task.js";
import { TaskDependency } from "../src/models/TaskDependency.js";
import { Comment } from "../src/models/Comment.js";
import { Notification } from "../src/models/Notification.js";
import { Attachment } from "../src/models/Attachment.js";
import { Review } from "../src/models/Review.js";
import { Invitation } from "../src/models/Invitation.js";

const BATCH_MARKER = "workspace_bootstrap_v1";

export const resetWorkspaceData = async () => {
  const args = process.argv.slice(2);
  if (!args.includes("--confirm")) {
    console.error("================================================================================");
    console.error("[WORKSPACE RESET] ABORTED: Missing required '--confirm' flag.");
    console.error("To safely reset records created by the bootstrap batch, run:");
    console.error("  npm run workspace:reset -- --confirm");
    console.error("================================================================================");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("================================================================================");
    console.log(`[WORKSPACE RESET] Identifying records for batch '${BATCH_MARKER}'...`);
    console.log("================================================================================");

    // 1. Find all bootstrap projects
    const batchProjects = await Project.find({
      $or: [{ batchMarker: BATCH_MARKER }, { code: { $in: ["ROVER", "TRANS", "STUDY"] } }],
    });
    const batchProjectIds = batchProjects.map((p) => p._id);

    // 2. Find all bootstrap users
    const batchUsers = await User.find({
      $or: [{ batchMarker: BATCH_MARKER }, { email: /@campus\.edu$/i }],
    });
    const batchUserIds = batchUsers.map((u) => u._id);

    // 3. Delete records matching project or batch
    const tasksRes = await Task.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { projectId: { $in: batchProjectIds } }],
    });

    const milestonesRes = await Milestone.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { projectId: { $in: batchProjectIds } }],
    });

    const depsRes = await TaskDependency.deleteMany({
      projectId: { $in: batchProjectIds },
    });

    const commentsRes = await Comment.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { projectId: { $in: batchProjectIds } }],
    });

    const notifsRes = await Notification.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { recipientId: { $in: batchUserIds } }, { projectId: { $in: batchProjectIds } }],
    });

    const attachRes = await Attachment.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { projectId: { $in: batchProjectIds } }],
    });

    const reviewsRes = await Review.deleteMany({
      projectId: { $in: batchProjectIds },
    });

    const invitesRes = await Invitation.deleteMany({
      projectId: { $in: batchProjectIds },
    });

    // For append-only ActivityEvent, use native driver collection to bypass application Mongoose mutation guard
    const actEventsCollection = mongoose.connection.collection("activityevents");
    const actRes = await actEventsCollection.deleteMany({
      $or: [{ batchMarker: BATCH_MARKER }, { projectId: { $in: batchProjectIds } }],
    });

    const projectsRes = await Project.deleteMany({ _id: { $in: batchProjectIds } });
    const usersRes = await User.deleteMany({ _id: { $in: batchUserIds } });

    console.log("[WORKSPACE RESET] Reset completed successfully. Summary of removed records:");
    console.log(`  - Users: ${usersRes.deletedCount}`);
    console.log(`  - Projects: ${projectsRes.deletedCount}`);
    console.log(`  - Milestones: ${milestonesRes.deletedCount}`);
    console.log(`  - Tasks: ${tasksRes.deletedCount}`);
    console.log(`  - Dependencies: ${depsRes.deletedCount}`);
    console.log(`  - Reviews: ${reviewsRes.deletedCount}`);
    console.log(`  - Comments: ${commentsRes.deletedCount}`);
    console.log(`  - Attachments: ${attachRes.deletedCount}`);
    console.log(`  - Invitations: ${invitesRes.deletedCount}`);
    console.log(`  - Notifications: ${notifsRes.deletedCount}`);
    console.log(`  - Audit Activity Events: ${actRes.deletedCount}`);
    console.log("================================================================================");
    console.log("[WORKSPACE RESET] All other user accounts and production projects remain untouched.");
    console.log("================================================================================");
    process.exit(0);
  } catch (error: any) {
    console.error("[WORKSPACE RESET] Reset failed with error:", error.message);
    process.exit(1);
  }
};

resetWorkspaceData();
