import axios from "axios";
import { ENV } from "../src/config/env.js";

const BASE_URL = `http://localhost:${ENV.PORT || 5000}`;
const PASSWORD = process.env.BOOTSTRAP_PASSWORD || "PulseTeam2026!";
const INTERVAL_MIN_SEC = parseInt(process.env.LIVE_INTERVAL_MIN || "8", 10);
const INTERVAL_MAX_SEC = parseInt(process.env.LIVE_INTERVAL_MAX || "20", 10);

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const runLiveSimulation = async () => {
  console.log("================================================================================");
  console.log("[WORKSPACE LIVE] Starting Autonomous Real-Time Activity Engine on Main Project...");
  console.log(`[WORKSPACE LIVE] Cadence: random action every ${INTERVAL_MIN_SEC}s - ${INTERVAL_MAX_SEC}s.`);
  console.log("Real actions will fire Socket.IO events to connected frontend clients.");
  console.log("Press Ctrl+C to stop cleanly at any time.");
  console.log("================================================================================");

  // 1. Authenticate seeded users
  const accounts = [
    { email: "elena.rostova@campus.edu", name: "Elena Rostova", role: "Owner" },
    { email: "marcus.vance@campus.edu", name: "Marcus Vance", role: "Manager" },
    { email: "aisha.patel@campus.edu", name: "Aisha Patel", role: "Member" },
    { email: "liam.chen@campus.edu", name: "Liam Chen", role: "Member" },
    { email: "sofia.rodriguez@campus.edu", name: "Sofia Rodriguez", role: "Member" },
    { email: "devon.miller@campus.edu", name: "Devon Miller", role: "Reviewer" },
  ];

  const tokens: Record<string, string> = {};
  for (const acc of accounts) {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: acc.email,
        password: PASSWORD,
      });
      tokens[acc.email] = res.data.token;
    } catch (err: any) {
      console.error(`[WORKSPACE LIVE] Failed to login as ${acc.email}:`, err.response?.data?.message || err.message);
      console.error("Please run 'npm run workspace:bootstrap' first to initialize the team.");
      process.exit(1);
    }
  }

  const authHeaders = (email: string) => ({
    headers: { Authorization: `Bearer ${tokens[email]}` },
  });

  // 2. Fetch Main Project (ROVER)
  let project: any = null;
  try {
    const pRes = await axios.get(`${BASE_URL}/api/projects`, authHeaders("elena.rostova@campus.edu"));
    project = pRes.data.projects.find((p: any) => p.code === "ROVER") || pRes.data.projects[0];
    if (!project) {
      console.error("[WORKSPACE LIVE] No projects found. Please run 'npm run workspace:bootstrap' first.");
      process.exit(1);
    }
    console.log(`[WORKSPACE LIVE] Target Project: '${project.name}' (${project.code}) [ID: ${project._id}]`);
  } catch (err: any) {
    console.error("[WORKSPACE LIVE] Could not fetch projects:", err.message);
    process.exit(1);
  }

  let running = true;
  let actionCount = 0;

  const shutdown = () => {
    console.log("\n================================================================================");
    console.log(`[WORKSPACE LIVE] Shutting down cleanly. Executed ${actionCount} live real-time actions.`);
    console.log("Persisted state remains consistent in MongoDB. Real-time engine halted.");
    console.log("================================================================================");
    running = false;
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Possible comment phrases with realistic mentions
  const commentPool = [
    { author: "aisha.patel@campus.edu", text: "@devon The unit test for local planner constraints is passing now. Ready for review." },
    { author: "liam.chen@campus.edu", text: "@marcus Updated the LiDAR frequency to 20Hz. Downstream SLAM pipeline jitter is resolved." },
    { author: "sofia.rodriguez@campus.edu", text: "@aisha The dashboard widget now shows the live point cloud resolution correctly." },
    { author: "devon.miller@campus.edu", text: "@liam Verified the emergency cutoff circuit latching behavior in unit test suite." },
    { author: "marcus.vance@campus.edu", text: "@elena Sprint velocity is tracking 12% ahead of Milestone 3 deadline target." },
  ];

  // Main Loop
  while (running) {
    const delaySec = getRandomInt(INTERVAL_MIN_SEC, INTERVAL_MAX_SEC);
    await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
    if (!running) break;

    try {
      // Fetch latest tasks for project
      const tasksRes = await axios.get(
        `${BASE_URL}/api/projects/${project._id}/tasks`,
        authHeaders("marcus.vance@campus.edu")
      );
      const tasks = tasksRes.data.tasks || [];
      if (tasks.length === 0) continue;

      actionCount++;
      const actionType = getRandomInt(1, 5);
      const timestamp = new Date().toLocaleTimeString();

      switch (actionType) {
        // Action 1: Add a comment with @mention
        case 1: {
          const sampleComment = commentPool[getRandomInt(0, commentPool.length - 1)];
          const targetTask = tasks[getRandomInt(0, tasks.length - 1)];
          await axios.post(
            `${BASE_URL}/api/tasks/${targetTask._id}/comments`,
            { text: sampleComment.text },
            authHeaders(sampleComment.author)
          );
          console.log(`[${timestamp}] [#${actionCount}] 💬 COMMENT: ${sampleComment.author.split("@")[0]} commented on '${targetTask.title.slice(0, 35)}...'`);
          break;
        }

        // Action 2: Advance a task from To Do -> In Progress
        case 2: {
          const todoTasks = tasks.filter((t: any) => t.status === "To Do");
          if (todoTasks.length > 0) {
            const task = todoTasks[getRandomInt(0, todoTasks.length - 1)];
            const userEmail = task.assigneeId?.email || "aisha.patel@campus.edu";
            try {
              await axios.patch(
                `${BASE_URL}/api/tasks/${task._id}/status`,
                { status: "In Progress" },
                authHeaders(userEmail in tokens ? userEmail : "marcus.vance@campus.edu")
              );
              console.log(`[${timestamp}] [#${actionCount}] 🚀 STATUS: '${task.title.slice(0, 35)}...' moved to In Progress`);
            } catch (err: any) {
              if (err.response?.status === 422) {
                console.log(`[${timestamp}] [#${actionCount}] 🛑 BLOCKED (422): Predecessor dependency not completed for '${task.title.slice(0, 30)}...' (Expected behavior)`);
              }
            }
          }
          break;
        }

        // Action 3: Request peer review for an In Progress task
        case 3: {
          const inProgress = tasks.filter((t: any) => t.status === "In Progress" && (!t.review || t.review.status === "None"));
          if (inProgress.length > 0) {
            const task = inProgress[getRandomInt(0, inProgress.length - 1)];
            const userEmail = task.assigneeId?.email || "aisha.patel@campus.edu";
            await axios.post(
              `${BASE_URL}/api/tasks/${task._id}/review-request`,
              {},
              authHeaders(userEmail in tokens ? userEmail : "marcus.vance@campus.edu")
            );
            console.log(`[${timestamp}] [#${actionCount}] 📋 REVIEW REQUEST: '${task.title.slice(0, 35)}...' submitted for peer review`);
          }
          break;
        }

        // Action 4: Submit peer review decision (Approve or Changes Requested)
        case 4: {
          const pendingReview = tasks.filter((t: any) => t.status === "In Review" || t.review?.status === "Pending Review");
          if (pendingReview.length > 0) {
            const task = pendingReview[getRandomInt(0, pendingReview.length - 1)];
            const isApproved = Math.random() > 0.35;
            const decision = isApproved ? "Approved" : "Changes Requested";
            const feedback = isApproved
              ? "Code meets all telemetry and latency requirements. Approved."
              : "Please refine the error recovery edge cases before completion.";

            await axios.post(
              `${BASE_URL}/api/tasks/${task._id}/review-decision`,
              { decision, feedback },
              authHeaders("devon.miller@campus.edu")
            );
            console.log(`[${timestamp}] [#${actionCount}] 🔍 REVIEW DECISION: Devon Miller marked '${task.title.slice(0, 30)}...' as ${decision}`);
          }
          break;
        }

        // Action 5: Report or Resolve Blocker
        case 5: {
          const blockedTasks = tasks.filter((t: any) => t.blocker?.isBlocked);
          if (blockedTasks.length > 0 && Math.random() > 0.4) {
            // Resolve existing blocker
            const task = blockedTasks[0];
            await axios.delete(
              `${BASE_URL}/api/tasks/${task._id}/blocker`,
              authHeaders("marcus.vance@campus.edu")
            );
            console.log(`[${timestamp}] [#${actionCount}] 🟢 UNBLOCKED: Blocker on '${task.title.slice(0, 35)}...' resolved by Marcus Vance`);
          } else {
            // Report new temporary blocker
            const inProgress = tasks.filter((t: any) => t.status === "In Progress" && !t.blocker?.isBlocked);
            if (inProgress.length > 0) {
              const task = inProgress[getRandomInt(0, inProgress.length - 1)];
              await axios.post(
                `${BASE_URL}/api/tasks/${task._id}/blocker`,
                { reason: "Transient CAN-bus frame drops observed in laboratory run.", severity: "Medium" },
                authHeaders("liam.chen@campus.edu")
              );
              console.log(`[${timestamp}] [#${actionCount}] ⚠️ BLOCKER: Liam Chen reported blocker on '${task.title.slice(0, 30)}...'`);
            }
          }
          break;
        }
      }
    } catch (err: any) {
      console.warn(`[WORKSPACE LIVE] Iteration notice:`, err.response?.data?.message || err.message);
    }
  }
};

runLiveSimulation();
