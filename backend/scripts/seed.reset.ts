import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Milestone } from "../src/models/Milestone.js";
import { Task } from "../src/models/Task.js";
import { Comment } from "../src/models/Comment.js";
import { ActivityEvent } from "../src/models/ActivityEvent.js";
import { Notification } from "../src/models/Notification.js";

export const resetDemoData = async () => {
  try {
    await connectDB();
    console.log("=================================================");
    console.log("[DEMO RESET] Cleaning up demo accounts and demo data...");
    console.log("=================================================");

    const demoUsers = await User.find({ email: /@demo\.local$/i });
    const demoUserIds = demoUsers.map((u) => u._id);

    const demoProjects = await Project.find({
      $or: [{ name: /\[DEMO DATA\]/i }, { ownerId: { $in: demoUserIds } }],
    });
    const demoProjectIds = demoProjects.map((p) => p._id);

    const tasksRes = await Task.deleteMany({ projectId: { $in: demoProjectIds } });
    const milestonesRes = await Milestone.deleteMany({ projectId: { $in: demoProjectIds } });
    const commentsRes = await Comment.deleteMany({ taskId: { $in: demoProjectIds } });
    const activityRes = await ActivityEvent.deleteMany({ projectId: { $in: demoProjectIds } });
    const notifsRes = await Notification.deleteMany({ recipientId: { $in: demoUserIds } });
    const projectsRes = await Project.deleteMany({ _id: { $in: demoProjectIds } });
    const usersRes = await User.deleteMany({ _id: { $in: demoUserIds } });

    console.log(`[DEMO RESET] Successfully removed:`);
    console.log(`  - ${usersRes.deletedCount} demo user(s) (@demo.local)`);
    console.log(`  - ${projectsRes.deletedCount} demo project(s)`);
    console.log(`  - ${tasksRes.deletedCount} demo task(s)`);
    console.log(`  - ${milestonesRes.deletedCount} demo milestone(s)`);
    console.log(`  - ${activityRes.deletedCount} demo activity event(s)`);
    console.log(`[DEMO RESET] Real user accounts and real projects remain untouched.`);
    console.log("=================================================");
    process.exit(0);
  } catch (error) {
    console.error("[DEMO RESET] Reset failed:", error);
    process.exit(1);
  }
};

resetDemoData();
