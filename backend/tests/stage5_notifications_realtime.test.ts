import assert from "assert";
import { app, server } from "../src/index.js";
import { User, Project, Task, ActivityEvent, Notification, Blocker, Review } from "../src/models/index.js";
import { checkOverdueAndBlockerAlerts } from "../src/services/alertCronService.js";

const TEST_EMAIL_OWNER = `test_stg5_owner_${Date.now()}@test.local`;
const TEST_EMAIL_DEV = `test_stg5_dev_${Date.now()}@test.local`;
const TEST_PASSWORD = "Password123!";

async function runStage5Tests() {
  console.log("=== RUNNING STAGE 5 AUDIT IMMUTABILITY, DEDUP NOTIFICATIONS & REAL-TIME TESTS ===");

  if (!server.listening) {
    try {
      server.listen(5000);
      await new Promise<void>((resolve) => {
        server.once("listening", () => resolve());
        setTimeout(resolve, 1500);
      });
    } catch {
      // server already listening
    }
  }

  const BASE_URL = `http://127.0.0.1:5000`;

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

  // 1. Register test users & setup project
  const resOwner = await request("POST", "/api/auth/register", {
    name: "Audit Owner",
    email: TEST_EMAIL_OWNER,
    password: TEST_PASSWORD,
  });
  assert.strictEqual(resOwner.status, 201);
  const ownerToken = resOwner.body.token;
  const ownerId = resOwner.body.user.id;

  const resDev = await request("POST", "/api/auth/register", {
    name: "Dev Member",
    email: TEST_EMAIL_DEV,
    password: TEST_PASSWORD,
  });
  assert.strictEqual(resDev.status, 201);
  const devToken = resDev.body.token;
  const devId = resDev.body.user.id;

  const projectRes = await request(
    "POST",
    "/api/projects",
    {
      name: "Stage 5 Audit Project",
      targetDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ownerToken
  );
  assert.strictEqual(projectRes.status, 201);
  const projectId = projectRes.body.project._id;

  await request(
    "POST",
    `/api/projects/${projectId}/members`,
    { email: TEST_EMAIL_DEV, role: "Team Member" },
    ownerToken
  );

  console.log("✔ Test environment established");

  // 2. Section 2.7: Append-Only Immutable ActivityEvent Verification
  console.log("Testing ActivityEvent immutability pre-hook enforcement...");
  const rawEvent = await ActivityEvent.collection.insertOne({
    projectId: projectRes.body.project._id,
    actorId: ownerId,
    eventType: "TASK_CREATED",
    summary: "Immutable audit test entry",
    createdAt: new Date(),
  });
  const eventId = rawEvent.insertedId;

  // Attempt updateOne -> must be rejected by pre-hook
  let updateRejected = false;
  try {
    await ActivityEvent.updateOne({ _id: eventId }, { summary: "Tampered content" });
  } catch (err: any) {
    if (err.message.includes("[Audit Rule Violation] ActivityEvent is strictly append-only")) {
      updateRejected = true;
    }
  }
  assert.strictEqual(updateRejected, true, "ActivityEvent.updateOne must be rejected by pre-hook");

  // Attempt deleteOne -> must be rejected by pre-hook
  let deleteRejected = false;
  try {
    await ActivityEvent.deleteOne({ _id: eventId });
  } catch (err: any) {
    if (err.message.includes("[Audit Rule Violation] ActivityEvent is strictly append-only")) {
      deleteRejected = true;
    }
  }
  assert.strictEqual(deleteRejected, true, "ActivityEvent.deleteOne must be rejected by pre-hook");

  // Verify the event is still intact and unmodified in the database
  const preservedEvent = await ActivityEvent.collection.findOne({ _id: eventId });
  assert.strictEqual(preservedEvent?.summary, "Immutable audit test entry", "Record must remain unchanged");
  console.log("✔ ActivityEvent append-only audit immutability strictly enforced");

  // 3. Section 2.8: Notification Deduplication via dedupKey
  console.log("Testing Notification dedupKey uniqueness...");
  const testDedupKey = `alert_dedup_test_${Date.now()}`;
  const notif1 = await Notification.create({
    recipientId: devId,
    projectId,
    type: "OVERDUE_ALERT",
    title: "Overdue Item",
    message: "First notification copy",
    dedupKey: testDedupKey,
  });
  assert.ok(notif1._id, "First notification created successfully");

  let duplicatePrevented = false;
  try {
    await Notification.create({
      recipientId: devId,
      projectId,
      type: "OVERDUE_ALERT",
      title: "Overdue Item Duplicate",
      message: "Second notification copy that should be rejected",
      dedupKey: testDedupKey,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      duplicatePrevented = true;
    }
  }
  assert.strictEqual(duplicatePrevented, true, "Duplicate dedupKey must trigger MongoDB 11000 unique constraint");
  console.log("✔ Notification deduplication via sparse unique dedupKey verified");

  // 4. Notification REST Endpoints
  console.log("Testing Notification API endpoints (GET, PATCH read, PATCH read-all)...");
  const getNotifs = await request("GET", "/api/notifications?unreadOnly=true", undefined, devToken);
  assert.strictEqual(getNotifs.status, 200);
  assert.ok(getNotifs.body.unreadCount >= 1, "Unread count must be at least 1");

  const markReadRes = await request(
    "PATCH",
    `/api/notifications/${notif1._id}/read`,
    undefined,
    devToken
  );
  assert.strictEqual(markReadRes.status, 200);
  assert.strictEqual(markReadRes.body.notification.isRead, true);

  const markAllRes = await request("PATCH", "/api/notifications/read-all", undefined, devToken);
  assert.strictEqual(markAllRes.status, 200);
  assert.strictEqual(markAllRes.body.success, true);
  console.log("✔ Notification read-status endpoints verified");

  // 5. Blocker Lifecycle & Synchronization
  console.log("Testing Blocker report and resolve synchronization...");
  const taskRes = await request(
    "POST",
    `/api/projects/${projectId}/tasks`,
    {
      title: "Blocker Test Task",
      assigneeId: devId,
      status: "In Progress",
    },
    ownerToken
  );
  assert.strictEqual(taskRes.status, 201);
  const taskId = taskRes.body.task._id;

  // Report Blocker
  const reportBlockerRes = await request(
    "POST",
    `/api/tasks/${taskId}/blocker`,
    { reason: "Missing API Gateway credentials", severity: "High" },
    devToken
  );
  assert.strictEqual(reportBlockerRes.status, 200);
  assert.strictEqual(reportBlockerRes.body.task.status, "Blocked");

  const openBlockerDoc = await Blocker.findOne({ taskId, status: "Open" });
  assert.ok(openBlockerDoc, "Blocker record must exist in DB with status Open");
  assert.strictEqual(openBlockerDoc.description, "Missing API Gateway credentials");

  // Resolve Blocker
  const resolveBlockerRes = await request(
    "POST",
    `/api/tasks/${taskId}/resolve-blocker`,
    undefined,
    devToken
  );
  assert.strictEqual(resolveBlockerRes.status, 200);
  assert.strictEqual(resolveBlockerRes.body.task.status, "In Progress");

  const resolvedBlockerDoc = await Blocker.findOne({ taskId, status: "Resolved" });
  assert.ok(resolvedBlockerDoc, "Blocker record must be updated to status Resolved");
  console.log("✔ Blocker reporting and resolution verified across Task and Blocker collections");

  // 6. Review Lifecycle & Synchronization
  console.log("Testing Review request and decision synchronization...");
  const reqReviewRes = await request(
    "POST",
    `/api/tasks/${taskId}/review/request`,
    { notes: "Deliverables attached for review" },
    devToken
  );
  assert.strictEqual(reqReviewRes.status, 200);
  assert.strictEqual(reqReviewRes.body.task.status, "In Review");

  const pendingReviewDoc = await Review.findOne({ taskId, status: "Pending Review" });
  assert.ok(pendingReviewDoc, "Review record must exist in DB with Pending Review");

  const reviewDecisionRes = await request(
    "POST",
    `/api/tasks/${taskId}/review/decision`,
    { decision: "Approved", feedback: "Code meets standards" },
    ownerToken
  );
  assert.strictEqual(reviewDecisionRes.status, 200);
  assert.strictEqual(reviewDecisionRes.body.task.status, "Done");

  const approvedReviewDoc = await Review.findOne({ taskId, status: "Approved" });
  assert.ok(approvedReviewDoc, "Review record must be updated to Approved");
  console.log("✔ Review request and decision verified across Task and Review collections");

  // 7. Background Alert Cron Execution Test
  console.log("Testing background alert cron function checkOverdueAndBlockerAlerts()...");
  const alertsCreated = await checkOverdueAndBlockerAlerts();
  assert.strictEqual(typeof alertsCreated, "number");
  console.log(`✔ Alert cron check executed successfully (${alertsCreated} alerts evaluated)`);

  // Cleanup test documents
  await Project.findByIdAndDelete(projectId);
  await Task.deleteMany({ projectId });
  await Notification.deleteMany({ projectId });
  await Blocker.deleteMany({ projectId });
  await Review.deleteMany({ projectId });
  await ActivityEvent.collection.deleteOne({ _id: eventId });
  await User.deleteMany({ email: { $in: [TEST_EMAIL_OWNER, TEST_EMAIL_DEV] } });

  console.log("=== ALL STAGE 5 NOTIFICATIONS, AUDIT & REAL-TIME TESTS PASSED! ===");
}

runStage5Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Stage 5 test failure:", err);
    process.exit(1);
  });
