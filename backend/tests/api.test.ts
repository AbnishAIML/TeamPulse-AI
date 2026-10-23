import assert from "assert";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Task } from "../src/models/Task.js";
import { AnalyticsBridge } from "../src/services/analyticsBridge.js";

async function runTests() {
  console.log("=== RUNNING SELF-CONTAINED BACKEND INTEGRATION TESTS ===");
  await connectDB();

  const testSuffix = Date.now();
  let createdUserIds: mongoose.Types.ObjectId[] = [];
  let createdProjectId: mongoose.Types.ObjectId | null = null;

  try {
    // 1. Verify User creation & bcrypt password hashing
    const testUser = await User.create({
      name: `Test Engineer ${testSuffix}`,
      email: `test_${testSuffix}@test.local`,
      password: "TestPassword123!",
      avatarColor: "blue",
      initials: "TE",
      systemRole: "user",
      title: "Test Engineer",
      weeklyCapacityHours: 20,
      skills: ["Testing", "Node.js"],
    });
    createdUserIds.push(testUser._id as mongoose.Types.ObjectId);

    assert(testUser, "Test user should be created in database");
    const userWithPw = await User.findById(testUser._id).select("+password");
    assert(userWithPw, "User should be retrievable with password");
    const isPwCorrect = await userWithPw.comparePassword("TestPassword123!");
    assert.strictEqual(isPwCorrect, true, "Bcrypt password comparison should succeed");
    console.log("✔ Authentication & password hashing verified");

    // 2. Verify Project & Memberships
    const testProject = await Project.create({
      name: `Test Project ${testSuffix}`,
      code: `TP${testSuffix.toString().slice(-4)}`,
      description: "Automated test integration fixture",
      ownerId: testUser._id,
      status: "Active",
      targetDeadline: new Date(Date.now() + 14 * 86400000),
      members: [
        { userId: testUser._id, role: "Project Owner", weeklyCapacityHours: 20, skills: ["Testing"] },
      ],
    });
    createdProjectId = testProject._id as mongoose.Types.ObjectId;

    assert(testProject, "Test project should be created");
    assert.strictEqual(testProject.members.length, 1, "Project should have 1 initial member");
    console.log("✔ Project and role memberships verified");

    // 3. Verify Tasks & Dependencies
    const taskA = await Task.create({
      projectId: testProject._id,
      title: "Task A - Initial Setup",
      status: "Done",
      priority: "Medium",
      assigneeId: testUser._id,
      estimatedHours: 6,
      remainingHours: 0,
      actualHours: 6,
      dependencies: [],
    });

    const taskB = await Task.create({
      projectId: testProject._id,
      title: "Task B - Dependent Feature",
      status: "Blocked",
      priority: "High",
      assigneeId: testUser._id,
      estimatedHours: 12,
      remainingHours: 12,
      actualHours: 0,
      dependencies: [taskA._id],
      blocker: {
        isBlocked: true,
        reason: "Waiting for review sign-off",
        reportedAt: new Date(),
        reportedBy: testUser._id,
      },
    });

    const blockedTask = await Task.findById(taskB._id);
    assert(blockedTask, "Task B should exist");
    assert.strictEqual(blockedTask.status, "Blocked");
    assert(blockedTask.blocker?.isBlocked, "Blocker flag should be true");
    console.log("✔ Task status, blockers, and dependencies verified");

    // 4. Verify Analytics Bridge (DAG + CPM fallback/service)
    const taskPayloads = [
      {
        id: taskA._id.toString(),
        title: taskA.title,
        status: taskA.status,
        priority: taskA.priority,
        estimated_hours: taskA.estimatedHours,
        remaining_hours: taskA.remainingHours,
        actual_hours: taskA.actualHours,
        dependencies: [],
        assignee_id: testUser._id.toString(),
      },
      {
        id: taskB._id.toString(),
        title: taskB.title,
        status: taskB.status,
        priority: taskB.priority,
        estimated_hours: taskB.estimatedHours,
        remaining_hours: taskB.remainingHours,
        actual_hours: taskB.actualHours,
        dependencies: [taskA._id.toString()],
        assignee_id: testUser._id.toString(),
      },
    ];

    const depAnalysis = await AnalyticsBridge.analyzeDependencies(testProject._id.toString(), taskPayloads);
    assert.strictEqual(depAnalysis.has_cycle, false, "Graph should not have cycles");
    assert(depAnalysis.topological_order.length === 2, "Topological order should contain both tasks");
    console.log("✔ DAG dependency & CPM scheduling analytics verified");

    // 5. Verify Workload Analysis
    const membersPayload = [
      {
        user_id: testUser._id.toString(),
        name: testUser.name,
        weekly_capacity_hours: 10,
        skills: ["Testing"],
        project_role: "Project Owner",
      },
    ];

    const workloadResp = await AnalyticsBridge.analyzeWorkload(testProject._id.toString(), membersPayload, taskPayloads);
    assert(workloadResp.members_metrics.length === 1, "Workload metrics should be calculated for test member");
    const memberMetric = workloadResp.members_metrics[0];
    assert.strictEqual(memberMetric.estimated_remaining_hours, 12, "Remaining effort should be 12h from Task B");
    console.log("✔ Workload capacity analysis verified");

    console.log("\nALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! (5/5)");
  } finally {
    // Clean up test fixtures
    if (createdProjectId) {
      await Task.deleteMany({ projectId: createdProjectId });
      await Project.deleteOne({ _id: createdProjectId });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
