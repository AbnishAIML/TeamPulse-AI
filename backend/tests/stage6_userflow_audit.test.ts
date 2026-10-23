import assert from "assert";
import mongoose from "mongoose";
import { app, server } from "../src/index.js";
import { User, Project, Task, Milestone, Invitation, Review, TaskDependency } from "../src/models/index.js";

async function runStage6Audit() {
  console.log("=== RUNNING STAGE 6 END-TO-END USER-FLOW AUDIT TEST ===");

  if (!server.listening) {
    await new Promise<void>((resolve) => {
      server.once("listening", () => resolve());
      setTimeout(resolve, 1500);
    });
  }

  const addr = server.address();
  let port = 5000;
  if (addr && typeof addr === "object") {
    port = addr.port;
  }
  const BASE_URL = `http://127.0.0.1:${port}`;

  const request = async (method: string, path: string, body?: any, token?: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") || "";
    let data: any;
    if (contentType.includes("json")) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => "");
    }
    return { status: res.status, body: data };
  };

  const auditId = Date.now();
  const ownerEmail = `audit.owner.${auditId}@test.local`;
  const reviewerEmail = `audit.reviewer.${auditId}@test.local`;
  const password = "AuditPassword123!";

  // 1. Register Owner
  console.log("1. Testing Owner Registration & Authentication...");
  const regRes = await request("POST", "/api/auth/register", {
    name: "Dr. Jane Smith",
    email: ownerEmail,
    password,
    title: "Project Lead",
    weeklyCapacityHours: 35,
  });
  assert.equal(regRes.status, 201, "Owner registration should succeed with 201");
  const ownerToken = regRes.body.token;
  const ownerId = regRes.body.user.id;
  assert.ok(ownerToken, "Should return valid JWT access token");
  console.log("✔ Owner registered and authenticated");

  // 2. Create Project with requireReviewForDone enabled
  console.log("2. Testing Project Creation with Quality Gate Enforcer...");
  const projRes = await request("POST", "/api/projects", {
    name: "Autonomous Campus Rover",
    code: "ACR",
    description: "Robotics and obstacle avoidance navigation platform",
    targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    settings: {
      requireReviewForDone: true,
    },
  }, ownerToken);
  assert.equal(projRes.status, 201, "Project creation should succeed with 201");
  const projectId = projRes.body.project._id;
  assert.equal(projRes.body.project.settings.requireReviewForDone, true, "requireReviewForDone should be true");
  console.log("✔ Project created with requireReviewForDone quality gate active");

  // 3. Create Milestone
  console.log("3. Testing Milestone Creation...");
  const milRes = await request("POST", `/api/projects/${projectId}/milestones`, {
    title: "Sprint 1: Sensor & Perception Pipeline",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Core perception drivers and obstacle detection algorithms",
  }, ownerToken);
  assert.equal(milRes.status, 201, "Milestone creation should succeed");
  const milestoneId = milRes.body.milestone._id;
  console.log("✔ Milestone created");

  // 4. Invite Reviewer & Tokenized Acceptance Flow
  console.log("4. Testing Collaborator Invitation & Acceptance Flow...");
  const invRes = await request("POST", `/api/projects/${projectId}/invitations`, {
    email: reviewerEmail,
    role: "Reviewer",
  }, ownerToken);
  assert.equal(invRes.status, 201, "Invitation creation should succeed");
  const inviteToken = invRes.body.invitation.token;
  assert.ok(inviteToken, "Should return unique invitation token");
  assert.ok(invRes.body.inviteLink.includes(inviteToken), "Invite link should contain token");

  // Register Reviewer
  const regRevRes = await request("POST", "/api/auth/register", {
    name: "Alex Researcher",
    email: reviewerEmail,
    password,
    title: "Senior QA & Peer Reviewer",
    weeklyCapacityHours: 20,
  });
  assert.equal(regRevRes.status, 201, "Reviewer registration should succeed");
  const reviewerToken = regRevRes.body.token;

  // Accept Invitation with token
  const acceptRes = await request("POST", "/api/invitations/accept", { token: inviteToken }, reviewerToken);
  assert.equal(acceptRes.status, 200, "Invitation acceptance should succeed with 200");
  assert.ok(
    acceptRes.body.project.members.some((m: any) => m.role === "Reviewer"),
    "Project members must include Reviewer"
  );
  console.log("✔ Tokenized invitation acceptance verified");

  // 5. Create Predecessor & Successor Tasks
  console.log("5. Testing Task Creation & DAG Linking...");
  const t1Res = await request("POST", `/api/projects/${projectId}/tasks`, {
    title: "LiDAR Driver Firmware",
    estimatedHours: 12,
    priority: "High",
    milestoneId,
  }, ownerToken);
  assert.equal(t1Res.status, 201);
  const task1Id = t1Res.body.task._id;

  const t2Res = await request("POST", `/api/projects/${projectId}/tasks`, {
    title: "Obstacle Avoidance Path Planner",
    estimatedHours: 20,
    priority: "Critical",
    milestoneId,
  }, ownerToken);
  assert.equal(t2Res.status, 201);
  const task2Id = t2Res.body.task._id;

  // Establish Finish-to-Start Dependency: Task 2 depends on Task 1
  const depRes = await request("POST", `/api/tasks/${task2Id}/dependencies`, {
    predecessorId: task1Id,
  }, ownerToken);
  assert.equal(depRes.status, 200, "Dependency link should be established");
  console.log("✔ Tasks created and DAG dependency established (Task 2 depends on Task 1)");

  // 6. Test What-If Delay Simulation API
  console.log("6. Testing What-If Delay Propagation Simulation API...");
  const simRes = await request("POST", `/api/projects/${projectId}/dependencies/simulate-delay`, {
    delayedTaskId: task1Id,
    delayHours: 16,
  }, ownerToken);
  assert.equal(simRes.status, 200, "Delay simulation should return 200");
  assert.ok(simRes.body.simulation, "Should return simulation body");
  const slippage = simRes.body.simulation.schedule_slippage_hours ?? simRes.body.simulation.project_schedule_slippage_hours;
  assert.ok(
    slippage !== undefined && slippage >= 0,
    "Should compute project schedule slippage"
  );
  console.log(
    `✔ Delay simulation verified: slippage = +${slippage}h`
  );

  // 7. Attempt to transition Task 2 to Done while Task 1 is still To Do (Must FAIL with HTTP 422)
  console.log("7. Testing Finish-to-Start Enforcer (422 rejection on premature successor completion)...");
  const invalidTransRes = await request("PATCH", `/api/tasks/${task2Id}/status`, {
    status: "Done",
  }, ownerToken);
  assert.equal(
    invalidTransRes.status,
    422,
    "Should return 422 Unprocessable Entity when finish-to-start predecessor is unfinished"
  );
  assert.ok(
    invalidTransRes.body.message.includes("Finish-to-Start dependency violation"),
    "Error message must specify Finish-to-Start dependency violation"
  );
  console.log("✔ Finish-to-Start 422 rejection strictly verified");

  // 8. Attempt to transition Task 1 to Done without review when requireReviewForDone is active (Must FAIL with HTTP 422)
  console.log("8. Testing Quality Gate Enforcer (422 rejection when peer review not approved)...");
  const noReviewDoneRes = await request("PATCH", `/api/tasks/${task1Id}/status`, {
    status: "Done",
  }, ownerToken);
  assert.equal(
    noReviewDoneRes.status,
    422,
    "Should return 422 Unprocessable Entity when peer review is not approved"
  );
  assert.ok(
    noReviewDoneRes.body.message.includes("Review required"),
    "Error message must state review required"
  );
  console.log("✔ Quality gate requireReviewForDone 422 rejection strictly verified");

  // 9. Request Review -> Reviewer Approves -> Transition to Done
  console.log("9. Testing Peer Review Request & Approval Workflow...");
  const reqRevRes = await request("POST", `/api/tasks/${task1Id}/review/request`, {
    notes: "LiDAR driver tested in gazebo simulation.",
  }, ownerToken);
  assert.equal(reqRevRes.status, 200, "Review request should succeed");

  const decRes = await request("POST", `/api/tasks/${task1Id}/review/decision`, {
    decision: "Approved",
    feedback: "Code clean, unit test coverage verified at 94%.",
  }, reviewerToken);
  assert.equal(decRes.status, 200, "Review approval decision should succeed");

  // Now move Task 1 to Done -> Must SUCCEED!
  const doneRes = await request("PATCH", `/api/tasks/${task1Id}/status`, {
    status: "Done",
  }, ownerToken);
  assert.equal(doneRes.status, 200, "Task 1 transition to Done should succeed now that review is approved");

  // Now move Task 2 to In Review -> Request Review -> Approve -> Done
  await request("POST", `/api/tasks/${task2Id}/review/request`, {
    notes: "A* and DWA local planner implemented.",
  }, ownerToken);
  await request("POST", `/api/tasks/${task2Id}/review/decision`, {
    decision: "Approved",
    feedback: "Path planning obstacle avoidance tests passed.",
  }, reviewerToken);
  const t2DoneRes = await request("PATCH", `/api/tasks/${task2Id}/status`, {
    status: "Done",
  }, ownerToken);
  assert.equal(t2DoneRes.status, 200, "Task 2 transition to Done should succeed now that Task 1 is Done");
  console.log("✔ Full peer review approval and cascading completion verified");

  // 10. Verify Milestone Auto-Progress
  console.log("10. Testing Automatic Milestone Progress Recalculation...");
  const updatedMilestone = await Milestone.findById(milestoneId);
  assert.equal(updatedMilestone?.progressPct, 100, "Milestone progressPct should automatically be 100%");
  assert.equal(updatedMilestone?.status, "Completed", "Milestone status should automatically be Completed");
  console.log("✔ Milestone auto-recalculated to 100% (Completed)");

  // 11. Reports & CSV Export endpoint verification
  console.log("11. Testing CSV Export Endpoint...");
  const csvRes = await request("GET", `/api/projects/${projectId}/reports/export-csv?type=tasks`, undefined, ownerToken);
  assert.equal(csvRes.status, 200, "CSV export should return 200");
  assert.ok(typeof csvRes.body === "string" && csvRes.body.includes("ID,Title"), "CSV must include headers");
  assert.ok(typeof csvRes.body === "string" && csvRes.body.includes("LiDAR Driver Firmware"), "CSV must include task 1");
  console.log("✔ CSV report generation verified");

  console.log("=== ALL STAGE 6 USER-FLOW AUDIT TESTS PASSED SUCCESSFULLY! (11/11) ===");

  // Cleanup
  await TaskDependency.deleteMany({ projectId });
  await Review.deleteMany({ projectId });
  await Task.deleteMany({ projectId });
  await Milestone.deleteMany({ projectId });
  await Invitation.deleteMany({ projectId });
  await Project.deleteMany({ _id: projectId });
  await User.deleteMany({ _id: { $in: [ownerId, regRevRes.body.user.id] } });

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runStage6Audit().catch((err) => {
  console.error("Stage 6 Audit Test Failed:", err);
  process.exit(1);
});
