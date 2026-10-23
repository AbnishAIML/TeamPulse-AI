import assert from "assert";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Task } from "../src/models/Task.js";
import { AnalyticsBridge } from "../src/services/analyticsBridge.js";

async function runTests() {
  console.log("=== RUNNING BACKEND INTEGRATION TESTS ===");
  await connectDB();

  try {
    // 1. Verify User model & password hashing
    const testUser = await User.findOne({ email: "ankit@teampulse.ai" }).select("+password");
    assert(testUser, "Seed user Ankit should exist in database");
    const isPwCorrect = await testUser.comparePassword("password123");
    assert.strictEqual(isPwCorrect, true, "Bcrypt password comparison should succeed");
    console.log("✔ Authentication & password hashing verified");

    // 2. Verify Project & Memberships
    const project = await Project.findOne({ code: "TPAI" });
    assert(project, "Demo project TPAI should exist");
    assert.strictEqual(project.members.length, 4, "Project should have 4 members");
    console.log("✔ Project and role memberships verified");

    // 3. Verify Tasks & Dependencies
    const tasks = await Task.find({ projectId: project._id });
    assert(tasks.length >= 10, "Project should have seeded tasks");

    const blockedTask = tasks.find((t) => t.status === "Blocked");
    assert(blockedTask, "There should be at least one blocked task");
    assert(blockedTask.blocker?.isBlocked, "Blocker flag should be true");
    console.log("✔ Task status, blockers, and dependencies verified");

    // 4. Verify Analytics Bridge (Native + Service)
    const taskPayloads = tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      status: t.status,
      priority: t.priority,
      estimated_hours: t.estimatedHours,
      remaining_hours: t.remainingHours,
      actual_hours: t.actualHours,
      dependencies: t.dependencies.map((d: any) => d.toString()),
      assignee_id: t.assigneeId?.toString(),
    }));

    const depAnalysis = await AnalyticsBridge.analyzeDependencies(project._id.toString(), taskPayloads);
    assert.strictEqual(depAnalysis.has_cycle, false, "Graph should not have cycles");
    assert(depAnalysis.topological_order.length > 0, "Topological order should be populated");
    assert(depAnalysis.blocked_tasks.length > 0, "Blocked tasks should be detected by DAG");
    console.log("✔ DAG dependency & blocker analytics verified");

    // 5. Verify Workload Analysis & Redistribution
    const membersPayload = project.members.map((m: any) => ({
      user_id: m.userId.toString(),
      name: "Member",
      weekly_capacity_hours: 20,
      skills: [],
      project_role: m.role,
    }));

    const workloadResp = await AnalyticsBridge.analyzeWorkload(project._id.toString(), membersPayload, taskPayloads);
    assert(workloadResp.members_metrics.length === 4, "Workload metrics should be calculated for all 4 members");
    const overloaded = workloadResp.members_metrics.find((m: any) => m.is_overloaded);
    assert(overloaded, "At least one member should be overloaded (Rahul)");
    assert(workloadResp.recommendations.length > 0, "Advisory recommendations should be proposed for overloaded member");
    console.log("✔ Workload analysis & advisory recommendations verified");

    console.log("\nALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! (5/5)");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTests();
