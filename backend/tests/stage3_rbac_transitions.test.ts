import assert from "assert";
import http from "http";
import { app, server } from "../src/index.js";
import { User, Project, Task, Milestone, Invitation, Review, TaskDependency } from "../src/models/index.js";

const TEST_EMAIL_OWNER = `test_owner_${Date.now()}@test.local`;
const TEST_EMAIL_MEMBER = `test_member_${Date.now()}@test.local`;
const TEST_EMAIL_REVIEWER = `test_reviewer_${Date.now()}@test.local`;
const TEST_EMAIL_OUTSIDER = `test_outsider_${Date.now()}@test.local`;
const TEST_PASSWORD = "Password123!";

async function runStage3Tests() {
  console.log("=== RUNNING STAGE 3 RBAC, REFRESH ROTATION & TRANSITION INTEGRATION TESTS ===");

  if (!server.listening) {
    await new Promise<void>((resolve) => {
      server.once("listening", () => resolve());
      setTimeout(resolve, 1500);
    });
  }

  // Get base URL from server address
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
    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data };
  };

  // 1. Register test users
  const resOwner = await request("POST", "/api/auth/register", {
    name: "Owner User",
    email: TEST_EMAIL_OWNER,
    password: TEST_PASSWORD,
    weeklyCapacityHours: 25,
  });
  assert.strictEqual(resOwner.status, 201, "Owner registration failed");
  const ownerToken = resOwner.body.token;
  const ownerRefreshToken = resOwner.body.refreshToken;
  const ownerId = resOwner.body.user.id;
  assert.ok(ownerRefreshToken, "Owner must receive refresh token");

  const resMember = await request("POST", "/api/auth/register", {
    name: "Team Member User",
    email: TEST_EMAIL_MEMBER,
    password: TEST_PASSWORD,
  });
  assert.strictEqual(resMember.status, 201);
  const memberToken = resMember.body.token;
  const memberId = resMember.body.user.id;

  const resReviewer = await request("POST", "/api/auth/register", {
    name: "Reviewer User",
    email: TEST_EMAIL_REVIEWER,
    password: TEST_PASSWORD,
  });
  assert.strictEqual(resReviewer.status, 201);
  const reviewerToken = resReviewer.body.token;
  const reviewerId = resReviewer.body.user.id;

  const resOutsider = await request("POST", "/api/auth/register", {
    name: "Outsider User",
    email: TEST_EMAIL_OUTSIDER,
    password: TEST_PASSWORD,
  });
  assert.strictEqual(resOutsider.status, 201);
  const outsiderToken = resOutsider.body.token;

  console.log("✔ User registration and refresh token issuance verified");

  // 2. Token refresh and rotation test
  const refreshRes = await request("POST", "/api/auth/refresh", {
    refreshToken: ownerRefreshToken,
  });
  assert.strictEqual(refreshRes.status, 200, "Token refresh failed");
  assert.ok(refreshRes.body.token, "Must return new access token");
  assert.ok(refreshRes.body.refreshToken, "Must rotate refresh token");

  // Old refresh token must be rejected (reuse detection)
  const reuseRes = await request("POST", "/api/auth/refresh", {
    refreshToken: ownerRefreshToken,
  });
  assert.strictEqual(reuseRes.status, 401, "Old refresh token reuse must be rejected");

  console.log("✔ Refresh token rotation and reuse prevention verified");

  // 3. Create Project with requireReviewForDone = true
  const projectRes = await request(
    "POST",
    "/api/projects",
    {
      name: "Stage 3 Test Project",
      targetDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      settings: {
        requireReviewForDone: true,
        productiveHoursPerDay: 6,
        workingDays: [1, 2, 3, 4, 5],
      },
    },
    ownerToken
  );
  if (projectRes.status !== 201) {
    console.error("Project creation failed:", projectRes.body);
  }
  assert.strictEqual(projectRes.status, 201);
  const projectId = projectRes.body.project._id;

  // Add Member and Reviewer to project
  const addMemRes = await request(
    "POST",
    `/api/projects/${projectId}/members`,
    { email: TEST_EMAIL_MEMBER, role: "Team Member" },
    ownerToken
  );
  assert.strictEqual(addMemRes.status, 200);

  const addRevRes = await request(
    "POST",
    `/api/projects/${projectId}/members`,
    { email: TEST_EMAIL_REVIEWER, role: "Reviewer" },
    ownerToken
  );
  assert.strictEqual(addRevRes.status, 200);

  console.log("✔ Project creation and member setup verified");

  // 4. Test RBAC Matrix (Section 2.1)
  // Outsider accessing project: 403
  const outsiderGet = await request("GET", `/api/projects/${projectId}`, undefined, outsiderToken);
  assert.strictEqual(outsiderGet.status, 403, "Outsider must receive 403 on project access");

  // Member attempting to edit project metadata: 403 (Owner only)
  const memberEditProject = await request(
    "PUT",
    `/api/projects/${projectId}`,
    { name: "Hacked Project" },
    memberToken
  );
  assert.strictEqual(memberEditProject.status, 403, "Member must not be allowed to edit project metadata");

  // Member attempting to delete project: 403 (Owner only)
  const memberDeleteProject = await request(
    "DELETE",
    `/api/projects/${projectId}`,
    undefined,
    memberToken
  );
  assert.strictEqual(memberDeleteProject.status, 403, "Member must not be allowed to delete project");

  // Reviewer attempting to create task: 403
  const reviewerCreateTask = await request(
    "POST",
    `/api/projects/${projectId}/tasks`,
    { title: "Reviewer illegal task" },
    reviewerToken
  );
  assert.strictEqual(reviewerCreateTask.status, 403, "Reviewer must receive 403 on task creation");

  console.log("✔ Section 2.1 RBAC permissions verified (403 on unauthorized actions)");

  // 5. Last-owner protection
  const demoteOwner = await request(
    "PUT",
    `/api/projects/${projectId}/members/${ownerId}`,
    { role: "Team Member" },
    ownerToken
  );
  assert.strictEqual(demoteOwner.status, 400, "Sole project owner cannot be demoted");

  const removeOwner = await request(
    "DELETE",
    `/api/projects/${projectId}/members/${ownerId}`,
    undefined,
    ownerToken
  );
  assert.strictEqual(removeOwner.status, 400, "Sole project owner cannot be removed");

  console.log("✔ Last-owner protection verified (400 on sole owner removal/demotion)");

  // 6. Milestone & Task transitions (Section 2.2)
  const milestoneRes = await request(
    "POST",
    `/api/projects/${projectId}/milestones`,
    {
      title: "Sprint 1 Milestone",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ownerToken
  );
  assert.strictEqual(milestoneRes.status, 201);
  const milestoneId = milestoneRes.body.milestone._id;

  // Create Task 1 (predecessor)
  const task1Res = await request(
    "POST",
    `/api/projects/${projectId}/tasks`,
    {
      title: "Task 1: Setup Backend Schema",
      milestoneId,
      assigneeId: memberId,
      status: "In Progress",
      estimatedHours: 5,
    },
    ownerToken
  );
  assert.strictEqual(task1Res.status, 201);
  const task1Id = task1Res.body.task._id;

  // Create Task 2 (successor, depends on Task 1)
  const task2Res = await request(
    "POST",
    `/api/projects/${projectId}/tasks`,
    {
      title: "Task 2: Build UI Components",
      milestoneId,
      assigneeId: memberId,
      status: "To Do",
      dependencies: [task1Id],
      estimatedHours: 4,
    },
    ownerToken
  );
  assert.strictEqual(task2Res.status, 201);
  const task2Id = task2Res.body.task._id;

  // Test illegal transition into In Progress while predecessor is unfinished: 422
  const startTask2Res = await request(
    "PATCH",
    `/api/tasks/${task2Id}/status`,
    { status: "In Progress" },
    memberToken
  );
  assert.strictEqual(startTask2Res.status, 422, "Must return 422 when starting task blocked by predecessor");
  assert.ok(startTask2Res.body.message.includes("blocked by predecessor task"), "Message must mention blocker");

  console.log("✔ Finish-to-Start dependency check verified (422 when predecessor not Done)");

  // Test requireReviewForDone rule:
  // Finish Task 1 predecessor: request review and approve
  await request(
    "POST",
    `/api/tasks/${task1Id}/review/request`,
    { notes: "Task 1 ready for sign-off" },
    memberToken
  );

  const approveReview1 = await request(
    "POST",
    `/api/tasks/${task1Id}/review/decision`,
    { decision: "Approved", feedback: "LGTM!" },
    reviewerToken
  );
  assert.strictEqual(approveReview1.status, 200, "Reviewer must be able to approve review");

  // Verify Task 1 is now Done
  const task1AfterApprove = await Task.findById(task1Id);
  assert.strictEqual(task1AfterApprove?.status, "Done");

  // Now Task 2 can start
  const startTask2Success = await request(
    "PATCH",
    `/api/tasks/${task2Id}/status`,
    { status: "In Progress" },
    memberToken
  );
  assert.strictEqual(startTask2Success.status, 200, "Task 2 should now be able to start");

  // Attempting to move Task 2 directly to Done without review: 422 (because requireReviewForDone=true)
  const task2DirectDone = await request(
    "PATCH",
    `/api/tasks/${task2Id}/status`,
    { status: "Done" },
    memberToken
  );
  assert.strictEqual(task2DirectDone.status, 422, "Direct move to Done without review must return 422");

  // Request review for Task 2 and approve
  await request(
    "POST",
    `/api/tasks/${task2Id}/review/request`,
    { notes: "Task 2 deliverables ready" },
    memberToken
  );

  await request(
    "POST",
    `/api/tasks/${task2Id}/review/decision`,
    { decision: "Approved", feedback: "Excellent job" },
    reviewerToken
  );

  // Verify milestone progress auto-calculated to 100% and Completed
  const updatedMilestone = await Milestone.findById(milestoneId);
  assert.strictEqual(updatedMilestone?.progressPct, 100, "Milestone progress must be 100%");
  assert.strictEqual(updatedMilestone?.status, "Completed", "Milestone status must be Completed");

  console.log("✔ requireReviewForDone enforcement & automatic milestone progress synchronization verified");

  // 7. Invitations Workflow
  const inviteEmail = `invitee_${Date.now()}@test.local`;
  const inviteRes = await request(
    "POST",
    `/api/projects/${projectId}/invitations`,
    { email: inviteEmail, role: "Team Member" },
    ownerToken
  );
  assert.strictEqual(inviteRes.status, 201);
  const inviteToken = inviteRes.body.invitation.token;
  assert.ok(inviteToken, "Must return invitation token");

  // Outsider accepts invitation
  const acceptRes = await request(
    "POST",
    "/api/invitations/accept",
    { token: inviteToken },
    outsiderToken
  );
  assert.strictEqual(acceptRes.status, 200, "Accept invitation failed");

  // Verify outsider is now a member and can view project
  const outsiderAccessAfterInvite = await request(
    "GET",
    `/api/projects/${projectId}`,
    undefined,
    outsiderToken
  );
  assert.strictEqual(outsiderAccessAfterInvite.status, 200, "Invited user must now have access to project");

  console.log("✔ Tokenized invitations creation and acceptance verified");

  // Cleanup test documents
  await Project.findByIdAndDelete(projectId);
  await Task.deleteMany({ projectId });
  await Milestone.deleteMany({ projectId });
  await Invitation.deleteMany({ projectId });
  await Review.deleteMany({ projectId });
  await TaskDependency.deleteMany({ projectId });
  await User.deleteMany({
    email: { $in: [TEST_EMAIL_OWNER, TEST_EMAIL_MEMBER, TEST_EMAIL_REVIEWER, TEST_EMAIL_OUTSIDER, inviteEmail] },
  });

  console.log("=== ALL STAGE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runStage3Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Stage 3 test failure:", err);
    process.exit(1);
  });
