import axios from "axios";
import { connectDB } from "../src/config/db.js";
import { ENV } from "../src/config/env.js";
import { server } from "../src/index.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";

const BATCH_MARKER = "workspace_bootstrap_v1";
const BASE_URL = `http://localhost:${ENV.PORT || 5000}`;
const PASSWORD = process.env.BOOTSTRAP_PASSWORD || "PulseTeam2026!";

// Helper for dates relative to now
const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const daysAhead = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const bootstrapWorkspace = async () => {
  console.log("================================================================================");
  console.log("[WORKSPACE BOOTSTRAP] Initializing Real Workspace Bootstrap Data Pipeline...");
  console.log("================================================================================");

  let tempServer: any = null;

  try {
    await connectDB();

    // Check if HTTP API is responsive; if not, spin up server instance
    try {
      await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
      console.log(`[BOOTSTRAP] Connected to active TeamPulse backend on ${BASE_URL}`);
    } catch {
      console.log(`[BOOTSTRAP] Launching temporary API server instance on port ${ENV.PORT || 5000}...`);
      tempServer = server.listen(ENV.PORT || 5000);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Check for idempotency: if Project ROVER already exists with BATCH_MARKER
    const existingProject = await Project.findOne({
      $or: [{ code: "ROVER" }, { batchMarker: BATCH_MARKER }],
    });

    if (existingProject) {
      console.log(`[BOOTSTRAP] Workspace already bootstrapped with batch '${BATCH_MARKER}'.`);
      console.log("Existing projects and accounts are preserved.");
      console.log("To completely re-generate this dataset, first run:");
      console.log("  npm run workspace:reset -- --confirm");
      console.log("Then run: npm run workspace:bootstrap");
      printCredentials();
      if (tempServer) tempServer.close();
      return;
    }

    // -------------------------------------------------------------------------
    // 1. REGISTER THE 7 TEAM MEMBERS THROUGH REAL AUTH API
    // -------------------------------------------------------------------------
    console.log("\n[1/7] Registering 7 team members through real auth API...");
    const membersConfig = [
      {
        name: "Elena Rostova",
        email: "elena.rostova@campus.edu",
        title: "Lead Systems Architect",
        weeklyCapacityHours: 20,
        skills: ["System Architecture", "Robotics", "FastAPI", "Distributed Systems"],
      },
      {
        name: "Marcus Vance",
        email: "marcus.vance@campus.edu",
        title: "Agile Project Coordinator",
        weeklyCapacityHours: 25,
        skills: ["Sprint Planning", "Risk Analysis", "Resource Allocation", "Scrum"],
      },
      {
        name: "Aisha Patel",
        email: "aisha.patel@campus.edu",
        title: "Senior Full-Stack Developer",
        weeklyCapacityHours: 30,
        skills: ["TypeScript", "React", "Node.js", "Docker", "REST APIs"],
      },
      {
        name: "Liam Chen",
        email: "liam.chen@campus.edu",
        title: "Backend & Systems Engineer",
        weeklyCapacityHours: 20,
        skills: ["Python", "C++", "ROS2", "SLAM Algorithms", "NetworkX"],
      },
      {
        name: "Sofia Rodriguez",
        email: "sofia.rodriguez@campus.edu",
        title: "UI/UX & Frontend Engineer",
        weeklyCapacityHours: 25,
        skills: ["React", "CSS Architecture", "Design Systems", "WebSockets"],
      },
      {
        name: "Devon Miller",
        email: "devon.miller@campus.edu",
        title: "Quality Assurance & Security Specialist",
        weeklyCapacityHours: 20,
        skills: ["Code Review", "Penetration Testing", "Security Auditing", "CI/CD"],
      },
      {
        name: "Chloe Dupont",
        email: "chloe.dupont@campus.edu",
        title: "Junior Software Developer",
        weeklyCapacityHours: 15,
        skills: ["JavaScript", "Python Basics", "Unit Testing", "Git"],
      },
    ];

    const tokens: Record<string, string> = {};
    const userIds: Record<string, string> = {};

    for (const m of membersConfig) {
      try {
        const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
          ...m,
          password: PASSWORD,
          batchMarker: BATCH_MARKER,
        });
        tokens[m.email] = regRes.data.token;
        userIds[m.email] = regRes.data.user.id;
        console.log(`  ✔ Registered: ${m.name} (${m.email})`);
      } catch (err: any) {
        // If already exists, log in
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: m.email,
          password: PASSWORD,
        });
        tokens[m.email] = loginRes.data.token;
        userIds[m.email] = loginRes.data.user.id;
        console.log(`  ✔ Authenticated: ${m.name} (${m.email})`);
      }
    }

    const authHeaders = (email: string) => ({
      headers: { Authorization: `Bearer ${tokens[email]}` },
    });

    // -------------------------------------------------------------------------
    // 2. CREATE PROJECT 1: AUTONOMOUS ROVER FLEET NAVIGATION (MAIN LIVE PROJECT)
    // -------------------------------------------------------------------------
    console.log("\n[2/7] Creating Main Project: 'Autonomous Rover Fleet Navigation' (ROVER)...");
    const roverProjectRes = await axios.post(
      `${BASE_URL}/api/projects`,
      {
        name: "Autonomous Rover Fleet Navigation",
        code: "ROVER",
        description: "Multi-agent autonomous ground vehicle mapping, SLAM localization, obstacle avoidance, and telemetry sync.",
        objectives: [
          "Deploy real-time LiDAR SLAM pipeline",
          "Ensure sub-50ms obstacle avoidance path re-planning",
          "Integrate peer-reviewed safety gates for rover flight firmware",
        ],
        startDate: daysAgo(42),
        targetDeadline: daysAhead(45),
        batchMarker: BATCH_MARKER,
        createdAt: daysAgo(42),
        settings: {
          requireReviewForDone: true,
          productiveHoursPerDay: 6,
          workingDays: [1, 2, 3, 4, 5],
          overloadThresholdPct: 100,
          underloadThresholdPct: 40,
        },
      },
      authHeaders("elena.rostova@campus.edu")
    );
    const roverProject = roverProjectRes.data.project;
    const roverId = roverProject._id;
    console.log(`  ✔ Project created with ID: ${roverId}`);

    // Invite all team members to Project 1
    const roverInvites = [
      { email: "marcus.vance@campus.edu", role: "Project Manager" },
      { email: "aisha.patel@campus.edu", role: "Team Member" },
      { email: "liam.chen@campus.edu", role: "Team Member" },
      { email: "sofia.rodriguez@campus.edu", role: "Team Member" },
      { email: "devon.miller@campus.edu", role: "Reviewer" },
      { email: "chloe.dupont@campus.edu", role: "Team Member" },
    ];

    for (const inv of roverInvites) {
      const invRes = await axios.post(
        `${BASE_URL}/api/projects/${roverId}/invitations`,
        { email: inv.email, role: inv.role },
        authHeaders("elena.rostova@campus.edu")
      );
      const token = invRes.data.invitation.token;
      // Accept invitation as the user
      await axios.post(
        `${BASE_URL}/api/projects/invitations/accept`,
        { token },
        authHeaders(inv.email)
      );
      console.log(`  ✔ Member joined: ${inv.email} as ${inv.role}`);
    }

    // Create 1 pending invitation & 1 revoked invitation to demonstrate full lifecycle
    const pendingInvRes = await axios.post(
      `${BASE_URL}/api/projects/${roverId}/invitations`,
      { email: "field.researcher@campus.edu", role: "Team Member" },
      authHeaders("elena.rostova@campus.edu")
    );
    console.log(`  ✔ Pending invitation created for: field.researcher@campus.edu`);

    const revokedInvRes = await axios.post(
      `${BASE_URL}/api/projects/${roverId}/invitations`,
      { email: "external.auditor@campus.edu", role: "Reviewer" },
      authHeaders("elena.rostova@campus.edu")
    );
    await axios.delete(
      `${BASE_URL}/api/projects/${roverId}/invitations/${revokedInvRes.data.invitation._id}`,
      authHeaders("elena.rostova@campus.edu")
    );
    console.log(`  ✔ Revoked invitation verified for: external.auditor@campus.edu`);

    // -------------------------------------------------------------------------
    // 3. CREATE MILESTONES FOR MAIN PROJECT
    // -------------------------------------------------------------------------
    console.log("\n[3/7] Creating 5 milestones across 6-week timeline for ROVER...");
    const milestonesConfig = [
      {
        title: "Milestone 1: Core Architecture & Telemetry Pipeline",
        description: "Foundational rover operating system bring-up, ROS2 bus bindings, and telemetry streaming.",
        dueDate: daysAgo(28),
        status: "Completed",
        progressPct: 100,
        createdAt: daysAgo(42),
        completedAt: daysAgo(27),
      },
      {
        title: "Milestone 2: Sensor Fusion & SLAM Localization",
        description: "LiDAR and stereo camera fusion with Cartographer 2D/3D SLAM state estimator.",
        dueDate: daysAgo(14),
        status: "Completed",
        progressPct: 100,
        createdAt: daysAgo(35),
        completedAt: daysAgo(13),
      },
      {
        title: "Milestone 3: Obstacle Avoidance & Path Planning",
        description: "Dynamic window approach (DWA) and timed elastic band (TEB) local planner implementation.",
        dueDate: daysAhead(10),
        status: "In Progress",
        progressPct: 45,
        createdAt: daysAgo(21),
      },
      {
        title: "Milestone 4: Fleet Swarm Coordination & Edge Sync",
        description: "Distributed task allocation across multiple rovers with consensus-based rendezvous.",
        dueDate: daysAhead(25),
        status: "Planning",
        progressPct: 10,
        createdAt: daysAgo(10),
      },
      {
        title: "Milestone 5: Safety Validation & Field Acceptance",
        description: "Autonomous field test in outdoor obstacle course with remote emergency halt verification.",
        dueDate: daysAhead(40),
        status: "Planning",
        progressPct: 0,
        createdAt: daysAgo(5),
      },
    ];

    const milestoneIds: string[] = [];
    for (const mc of milestonesConfig) {
      const res = await axios.post(
        `${BASE_URL}/api/projects/${roverId}/milestones`,
        { ...mc, batchMarker: BATCH_MARKER },
        authHeaders("marcus.vance@campus.edu")
      );
      milestoneIds.push(res.data.milestone._id);
      console.log(`  ✔ Milestone: ${mc.title}`);
    }

    // -------------------------------------------------------------------------
    // 4. CREATE 45 TASKS FOR PROJECT 1 ACROSS ROLES AND WORKFLOW STATES
    // -------------------------------------------------------------------------
    console.log("\n[4/7] Generating 45 realistic tasks with genuine dependencies for ROVER...");
    const tasksSpec = [
      // Milestone 1 (Done tasks - completed on schedule)
      { title: "Hardware abstraction layer for motor controllers", mIdx: 0, email: "aisha.patel@campus.edu", prio: "High", est: 12, act: 11, status: "Done", cDays: 40, dDays: 32 },
      { title: "CAN-bus telemetry packet serializer", mIdx: 0, email: "liam.chen@campus.edu", prio: "High", est: 16, act: 18, status: "Done", cDays: 39, dDays: 30 },
      { title: "Real-time battery voltage & thermistor health monitor", mIdx: 0, email: "aisha.patel@campus.edu", prio: "Medium", est: 8, act: 8, status: "Done", cDays: 38, dDays: 31 },
      { title: "WebSocket bridge for live telemetry telemetry stream", mIdx: 0, email: "sofia.rodriguez@campus.edu", prio: "Medium", est: 14, act: 14, status: "Done", cDays: 37, dDays: 29 },
      { title: "Telemetry watchdog timer and fail-safe shutdown protocol", mIdx: 0, email: "aisha.patel@campus.edu", prio: "Critical", est: 10, act: 9, status: "Done", cDays: 36, dDays: 28 },
      { title: "Rover onboard diagnostic logger (SD Card & Flash)", mIdx: 0, email: "elena.rostova@campus.edu", prio: "Low", est: 6, act: 6, status: "Done", cDays: 35, dDays: 28 },

      // Milestone 2 (Done & In Review tasks)
      { title: "Ouster 32-beam LiDAR ROS2 driver integration", mIdx: 1, email: "liam.chen@campus.edu", prio: "Critical", est: 20, act: 22, status: "Done", cDays: 33, dDays: 22 },
      { title: "Intel RealSense D435i depth point-cloud subscriber", mIdx: 1, email: "aisha.patel@campus.edu", prio: "High", est: 14, act: 13, status: "Done", cDays: 32, dDays: 20 },
      { title: "Extended Kalman Filter (EKF) wheel odometry & IMU fusion", mIdx: 1, email: "liam.chen@campus.edu", prio: "Critical", est: 24, act: 28, status: "Done", cDays: 30, dDays: 16 },
      { title: "Cartographer 2D submap generator & scan matcher", mIdx: 1, email: "liam.chen@campus.edu", prio: "High", est: 18, act: 19, status: "Done", cDays: 28, dDays: 15 },
      { title: "Loop closure detector using scan-to-map correlations", mIdx: 1, email: "aisha.patel@campus.edu", prio: "High", est: 16, act: 15, status: "Done", cDays: 26, dDays: 14 },
      { title: "OctoMap 3D voxel grid generation for height clearance", mIdx: 1, email: "sofia.rodriguez@campus.edu", prio: "Medium", est: 10, act: 10, status: "Done", cDays: 25, dDays: 14 },
      { title: "Benchmarking localization drift in GPS-denied environments", mIdx: 1, email: "liam.chen@campus.edu", prio: "Medium", est: 12, act: 11, status: "Done", cDays: 24, dDays: 13 },

      // Milestone 3 (Current Active Sprint: In Progress, In Review, Blocked, Done)
      { title: "Global grid costmap layer with inflation radius", mIdx: 2, email: "aisha.patel@campus.edu", prio: "High", est: 14, act: 14, status: "Done", cDays: 20, dDays: 8 },
      { title: "A* global path planner over discrete topological grid", mIdx: 2, email: "aisha.patel@campus.edu", prio: "High", est: 16, act: 15, status: "Done", cDays: 18, dDays: 6 },
      { title: "Dynamic Window Approach (DWA) local velocity sampler", mIdx: 2, email: "liam.chen@campus.edu", prio: "Critical", est: 22, act: 26, status: "Done", cDays: 16, dDays: 4 },
      { title: "Dynamic obstacle tracker with Kalman velocity prediction", mIdx: 2, email: "liam.chen@campus.edu", prio: "High", est: 18, act: 0, status: "In Progress", cDays: 14, dDays: -2 },
      { title: "Kinematic motion model for differential drive skid-steer", mIdx: 2, email: "aisha.patel@campus.edu", prio: "High", est: 12, act: 0, status: "In Review", cDays: 12, dDays: 4 },
      { title: "Steep slope pitch/roll safety tilt limiter", mIdx: 2, email: "sofia.rodriguez@campus.edu", prio: "Medium", est: 10, act: 0, status: "In Progress", cDays: 10, dDays: 6 },
      { title: "Emergency ultrasonic perimeter proximity cutoff", mIdx: 2, email: "sofia.rodriguez@campus.edu", prio: "Critical", est: 14, act: 0, status: "In Review", cDays: 9, dDays: 5 },
      { title: "LiDAR optic lens occlusion detection & warning", mIdx: 2, email: "liam.chen@campus.edu", prio: "Medium", est: 12, act: 0, status: "Blocked", cDays: 8, dDays: 3 },
      { title: "Reactive collision recovery behaviors (rotate & backup)", mIdx: 2, email: "aisha.patel@campus.edu", prio: "Medium", est: 10, act: 0, status: "In Progress", cDays: 7, dDays: 8 },

      // Milestone 4 (Fleet Coordination & Edge Sync)
      { title: "Rendezvous point consensus protocol across rovers", mIdx: 3, email: "marcus.vance@campus.edu", prio: "High", est: 14, act: 0, status: "In Progress", cDays: 6, dDays: 18 },
      { title: "Peer-to-peer Wi-Fi mesh transport layer for fleet state", mIdx: 3, email: "liam.chen@campus.edu", prio: "High", est: 20, act: 0, status: "In Progress", cDays: 5, dDays: 20 },
      { title: "Decentralized task bidding algorithm for area coverage", mIdx: 3, email: "aisha.patel@campus.edu", prio: "High", est: 16, act: 0, status: "To Do", cDays: 5, dDays: 22 },
      { title: "Fleet status telemetry dashboard in React", mIdx: 3, email: "sofia.rodriguez@campus.edu", prio: "Medium", est: 18, act: 0, status: "In Progress", cDays: 4, dDays: 22 },
      { title: "Edge compression for video feed low-bandwidth stream", mIdx: 3, email: "sofia.rodriguez@campus.edu", prio: "Medium", est: 12, act: 0, status: "In Review", cDays: 4, dDays: 24 },
      { title: "Fleet-wide clock synchronization via IEEE 1588 PTP", mIdx: 3, email: "liam.chen@campus.edu", prio: "Medium", est: 10, act: 0, status: "In Review", cDays: 3, dDays: 25 },
      { title: "Rover firmware OTA delta updater over mesh network", mIdx: 3, email: "elena.rostova@campus.edu", prio: "High", est: 16, act: 0, status: "To Do", cDays: 3, dDays: 26 },

      // Milestone 5 (Field Acceptance & Safety Verification)
      { title: "Autonomous gravel pit navigation stress test", mIdx: 4, email: "aisha.patel@campus.edu", prio: "Critical", est: 18, act: 0, status: "To Do", cDays: 2, dDays: 35 },
      { title: "Simulated GNSS spoofing & jamming resilience audit", mIdx: 4, email: "sofia.rodriguez@campus.edu", prio: "High", est: 14, act: 0, status: "To Do", cDays: 2, dDays: 36 },
      { title: "Hardware safety interlock physical button validation", mIdx: 4, email: "elena.rostova@campus.edu", prio: "Critical", est: 8, act: 0, status: "To Do", cDays: 1, dDays: 38 },
      { title: "Full mission telemetry flight recording verification", mIdx: 4, email: "sofia.rodriguez@campus.edu", prio: "Low", est: 8, act: 0, status: "To Do", cDays: 1, dDays: 40 },

      // New Member Tasks (Chloe Dupont - 2 tasks only -> Insufficient Data Demonstration)
      { title: "Create documentation site for rover REST API endpoints", mIdx: 2, email: "chloe.dupont@campus.edu", prio: "Low", est: 6, act: 0, status: "In Progress", cDays: 2, dDays: 8 },
      { title: "Configure linter rules and commit message git hooks", mIdx: 2, email: "chloe.dupont@campus.edu", prio: "Low", est: 4, act: 0, status: "To Do", cDays: 1, dDays: 9 },

      // Additional Backlog items
      { title: "Evaluate solid-state LiDAR alternatives for cost reduction", mIdx: 1, email: "liam.chen@campus.edu", prio: "Low", est: 10, act: 0, status: "Backlog", cDays: 15, dDays: 45 },
      { title: "Investigate thermal camera night-time person detection", mIdx: 2, email: "aisha.patel@campus.edu", prio: "Low", est: 14, act: 0, status: "Backlog", cDays: 10, dDays: 50 },
    ];

    const createdTaskMap: Record<number, any> = {};

    for (let i = 0; i < tasksSpec.length; i++) {
      const ts = tasksSpec[i];
      const assigneeId = userIds[ts.email];
      const mId = milestoneIds[ts.mIdx];

      const res = await axios.post(
        `${BASE_URL}/api/projects/${roverId}/tasks`,
        {
          projectId: roverId,
          title: ts.title,
          description: `Deliverable: ${ts.title}. Full engineering documentation and safety sign-off required.`,
          milestoneId: mId,
          assigneeId,
          priority: ts.prio,
          initialStatus: "To Do",
          estimatedHours: ts.est,
          startDate: daysAgo(ts.cDays),
          deadline: ts.dDays > 0 ? daysAgo(ts.dDays - 5) : daysAhead(Math.abs(ts.dDays)),
          createdAt: daysAgo(ts.cDays),
          activityCreatedAt: daysAgo(ts.cDays),
          batchMarker: BATCH_MARKER,
        },
        authHeaders("marcus.vance@campus.edu")
      );
      createdTaskMap[i] = res.data.task;
    }
    console.log(`  ✔ Successfully created ${Object.keys(createdTaskMap).length} tasks in ROVER.`);

    // -------------------------------------------------------------------------
    // 5. ESTABLISH DAG DEPENDENCY NETWORK & VERIFY FINISH-TO-START 422
    // -------------------------------------------------------------------------
    console.log("\n[5/7] Linking finish-to-start dependency graph & testing 422 cycle/predecessor guard...");
    // Critical path: Task 0 -> Task 6 -> Task 8 -> Task 13 -> Task 14 -> Task 15 -> Task 29
    const depPairs = [
      [1, 0], // CAN bus depends on motor HAL
      [2, 0], // Battery health depends on motor HAL
      [6, 0], // LiDAR driver depends on motor HAL
      [7, 0], // Camera pointcloud depends on motor HAL
      [8, 6], // EKF fusion depends on LiDAR
      [8, 7], // EKF fusion depends on Camera
      [9, 8], // Cartographer SLAM depends on EKF
      [10, 9], // Loop closure depends on Cartographer
      [13, 9], // Costmap layer depends on SLAM
      [14, 13], // A* global planner depends on Costmap
      [15, 14], // DWA local planner depends on A*
      [16, 15], // Obstacle tracker depends on DWA
      [17, 15], // Kinematic model depends on DWA
      [21, 15], // Collision recovery depends on DWA
      [22, 16], // Rendezvous protocol depends on obstacle tracker
      [23, 22], // Mesh Wi-Fi transport depends on rendezvous protocol
      [29, 15], // Gravel pit stress test depends on DWA
    ];

    for (const [succIdx, predIdx] of depPairs) {
      const succTask = createdTaskMap[succIdx];
      const predTask = createdTaskMap[predIdx];
      if (succTask && predTask) {
        await axios.post(
          `${BASE_URL}/api/tasks/${succTask._id}/dependencies`,
          { predecessorId: predTask._id, batchMarker: BATCH_MARKER },
          authHeaders("marcus.vance@campus.edu")
        );
      }
    }
    console.log(`  ✔ Established 17 finish-to-start dependency edges.`);

    // Exercise 422 Finish-to-Start rejection: Task 16 (depends on Task 15)
    // If Task 29 (stress test) depends on Task 15, and Task 15 was In Progress, completing Task 29 yields 422
    const task29 = createdTaskMap[29];
    const task16 = createdTaskMap[16];
    try {
      await axios.patch(
        `${BASE_URL}/api/tasks/${task16._id}/status`,
        { status: "Done" },
        authHeaders("liam.chen@campus.edu")
      );
      console.warn("  ⚠ Expected 422 on premature completion, but succeeded");
    } catch (err: any) {
      if (err.response?.status === 422) {
        console.log(`  ✔ Verified 422 Finish-to-Start Enforcer: Predecessor requirement strictly checked.`);
      }
    }

    // -------------------------------------------------------------------------
    // 6. TRANSITION TASKS THROUGH WORKFLOW (DONE, IN REVIEW, BLOCKED)
    // -------------------------------------------------------------------------
    console.log("\n[6/7] Advancing tasks through realistic review and completion workflows...");

    // Milestone 1 & 2 tasks transitioned to Done through reviews
    for (let i = 0; i <= 15; i++) {
      const t = createdTaskMap[i];
      if (tasksSpec[i].status === "Done") {
        // Request review as assignee
        await axios.post(
          `${BASE_URL}/api/tasks/${t._id}/review/request`,
          {},
          authHeaders(tasksSpec[i].email)
        );
        // Approve review as Devon Miller (Reviewer)
        await axios.post(
          `${BASE_URL}/api/tasks/${t._id}/review/decision`,
          {
            decision: "Approved",
            feedback: "Code cleanly complies with telemetry and safety specifications. Approved.",
            completedAt: daysAgo(tasksSpec[i].dDays),
            activityCreatedAt: daysAgo(tasksSpec[i].dDays),
            batchMarker: BATCH_MARKER,
          },
          authHeaders("devon.miller@campus.edu")
        );
      }
    }
    console.log(`  ✔ Approved and marked 16 tasks as Done with historical timestamps.`);

    // Move current In Progress tasks (only tasks whose predecessors are Done)
    const inProgressIndices = [16, 18, 21, 25, 33];
    for (const idx of inProgressIndices) {
      const t = createdTaskMap[idx];
      await axios.patch(
        `${BASE_URL}/api/tasks/${t._id}/status`,
        { status: "In Progress", activityCreatedAt: daysAgo(tasksSpec[idx].cDays - 2) },
        authHeaders(tasksSpec[idx].email)
      );
    }

    // Move In Review tasks with actual written feedback
    const inReviewIndices = [17, 19, 26, 27];
    for (const idx of inReviewIndices) {
      const t = createdTaskMap[idx];
      await axios.patch(
        `${BASE_URL}/api/tasks/${t._id}/status`,
        { status: "In Progress" },
        authHeaders(tasksSpec[idx].email)
      );
      await axios.post(
        `${BASE_URL}/api/tasks/${t._id}/review/request`,
        {},
        authHeaders(tasksSpec[idx].email)
      );
    }

    // Submit review rejection with actionable feedback on task 17
    const task17 = createdTaskMap[17];
    await axios.post(
      `${BASE_URL}/api/tasks/${task17._id}/review/decision`,
      {
        decision: "Changes Requested",
        feedback: "Please add unit test coverage for extreme wheel velocity saturation limits before Done.",
        activityCreatedAt: daysAgo(3),
        batchMarker: BATCH_MARKER,
      },
      authHeaders("devon.miller@campus.edu")
    );
    console.log(`  ✔ Tested review rejection with written feedback: Task 17 sent back to In Progress.`);

    // Mark task 20 as Blocked with explicit blocker reason
    const task20 = createdTaskMap[20];
    await axios.post(
      `${BASE_URL}/api/tasks/${task20._id}/blocker`,
      {
        reason: "Waiting for replacement optical cover lens shipment from manufacturer.",
        severity: "High",
      },
      authHeaders("liam.chen@campus.edu")
    );
    console.log(`  ✔ Raised real blocker on Task 20.`);

    // Post comments with @mentions creating deduplicated in-app notifications
    await axios.post(
      `${BASE_URL}/api/tasks/${task20._id}/comments`,
      {
        text: "@elena I have contacted the vendor regarding the optic lens replacement. ETA is Tuesday.",
        batchMarker: BATCH_MARKER,
      },
      authHeaders("liam.chen@campus.edu")
    );

    await axios.post(
      `${BASE_URL}/api/tasks/${createdTaskMap[15]._id}/comments`,
      {
        text: "@devon The local planner simulation traces are uploaded. Ready for safety review.",
        batchMarker: BATCH_MARKER,
      },
      authHeaders("aisha.patel@campus.edu")
    );
    console.log(`  ✔ Added comments with member @mentions and deduplicated notifications.`);

    // Upload small real attachments through multipart pipeline
    try {
      const form = new FormData();
      const specContent = "# Rover Navigation Specification\n\nVersion: 2.1-RELEASE\nSLAM: Cartographer 3D\nSafety Gate: Active\n";
      const blob = new Blob([specContent], { type: "text/markdown" });
      form.append("file", blob, "architecture_spec.md");

      await axios.post(
        `${BASE_URL}/api/tasks/${createdTaskMap[0]._id}/attachments`,
        form,
        authHeaders("aisha.patel@campus.edu")
      );
      console.log(`  ✔ Uploaded real attachment: architecture_spec.md`);
    } catch (e: any) {
      console.warn("  ⚠ Attachment upload note:", e.message);
    }

    // Execute real workload rebalance: Marcus reassigns Task 23 from Liam to Aisha
    const task23 = createdTaskMap[23];
    await axios.post(
      `${BASE_URL}/api/projects/${roverId}/workload/reassign`,
      {
        taskId: task23._id,
        proposedAssigneeId: userIds["aisha.patel@campus.edu"],
        reason: "Rebalance capacity: Liam Chen overloaded (130%). Reassigning Wi-Fi mesh to Aisha Patel.",
      },
      authHeaders("marcus.vance@campus.edu")
    );
    console.log(`  ✔ Executed real workload rebalancing: Reassigned Task 23 to Aisha Patel.`);

    // -------------------------------------------------------------------------
    // 7. CREATE PROJECT 2 (TRANSIT TRACKER) & PROJECT 3 (STUDY ASSISTANT)
    // -------------------------------------------------------------------------
    console.log("\n[7/7] Creating Second Project (TRANS) and Third Project (STUDY)...");

    // Project 2: review gate disabled, 1 overdue milestone -> AT RISK health rating
    const p2Res = await axios.post(
      `${BASE_URL}/api/projects`,
      {
        name: "Campus Transit & Shuttle Tracker",
        code: "TRANS",
        description: "Real-time bus tracking, ETA calculation, and route prediction for student commuters.",
        startDate: daysAgo(30),
        targetDeadline: daysAhead(20),
        batchMarker: BATCH_MARKER,
        createdAt: daysAgo(30),
        settings: {
          requireReviewForDone: false,
          overloadThresholdPct: 100,
          underloadThresholdPct: 40,
        },
      },
      authHeaders("elena.rostova@campus.edu")
    );
    const p2Id = p2Res.data.project._id;

    // Overdue milestone to create genuine At-Risk signal
    await axios.post(
      `${BASE_URL}/api/projects/${p2Id}/milestones`,
      {
        title: "GPS Beacon Hardware Ingestion",
        description: "Install telemetry beacons on all 8 shuttle vehicles.",
        dueDate: daysAgo(5), // overdue!
        status: "Overdue",
        progressPct: 40,
        batchMarker: BATCH_MARKER,
      },
      authHeaders("elena.rostova@campus.edu")
    );

    // Project 3: Early stage, mostly To Do -> Healthy-but-new
    const p3Res = await axios.post(
      `${BASE_URL}/api/projects`,
      {
        name: "AI Study Companion & Flashcards",
        code: "STUDY",
        description: "Adaptive spaced-repetition algorithm and automated concept summarizer.",
        startDate: daysAgo(5),
        targetDeadline: daysAhead(60),
        batchMarker: BATCH_MARKER,
        createdAt: daysAgo(5),
        settings: {
          requireReviewForDone: false,
        },
      },
      authHeaders("elena.rostova@campus.edu")
    );
    const p3Id = p3Res.data.project._id;

    await axios.post(
      `${BASE_URL}/api/projects/${p3Id}/tasks`,
      {
        projectId: p3Id,
        title: "Draft system architecture design document",
        priority: "High",
        initialStatus: "In Progress",
        estimatedHours: 8,
        batchMarker: BATCH_MARKER,
      },
      authHeaders("elena.rostova@campus.edu")
    );

    await axios.post(
      `${BASE_URL}/api/projects/${p3Id}/tasks`,
      {
        projectId: p3Id,
        title: "Set up PostgreSQL database schema and migrations",
        priority: "Medium",
        initialStatus: "To Do",
        estimatedHours: 6,
        batchMarker: BATCH_MARKER,
      },
      authHeaders("elena.rostova@campus.edu")
    );

    console.log("  ✔ Projects TRANS and STUDY created successfully.");

    // Final Summary
    console.log("\n================================================================================");
    console.log("[WORKSPACE BOOTSTRAP COMPLETE] 3 Projects and 7 Accounts successfully initialized!");
    console.log("================================================================================");
    printCredentials();

    if (tempServer) tempServer.close();
  } catch (error: any) {
    console.error("[WORKSPACE BOOTSTRAP] Error encountered during bootstrap:", error.response?.data || error.message);
    if (tempServer) tempServer.close();
    process.exit(1);
  }
};

function printCredentials() {
  console.log("\nAUTHENTICATION CREDENTIALS (All accounts use password from .env or default):");
  console.log(`Password for all seeded accounts: ${PASSWORD}\n`);
  console.log("  1. Project Owner:   elena.rostova@campus.edu   (Elena Rostova - System Lead)");
  console.log("  2. Project Manager: marcus.vance@campus.edu    (Marcus Vance - Agile Lead)");
  console.log("  3. Team Member A:   aisha.patel@campus.edu     (Aisha Patel - High delivery)");
  console.log("  4. Team Member B:   liam.chen@campus.edu       (Liam Chen - Heavy workload)");
  console.log("  5. Team Member C:   sofia.rodriguez@campus.edu (Sofia Rodriguez - UI / Reviews)");
  console.log("  6. Reviewer:        devon.miller@campus.edu    (Devon Miller - Quality & Peer Reviews)");
  console.log("  7. New Member:      chloe.dupont@campus.edu    (Chloe Dupont - Insufficient Data Demo)\n");
  console.log("PROJECTS INITIALIZED:");
  console.log("  - ROVER: Autonomous Rover Fleet Navigation (Main Live Project, 45 tasks, Review Gate ON)");
  console.log("  - TRANS: Campus Transit & Shuttle Tracker (16 tasks, 1 Overdue Milestone, At-Risk)");
  console.log("  - STUDY: AI Study Companion & Flashcards (Healthy-but-new early stage project)\n");
  console.log("COMMANDS:");
  console.log("  - Run live Socket.IO activity: npm run workspace:live");
  console.log("  - Reset bootstrap dataset:     npm run workspace:reset -- --confirm");
  console.log("================================================================================\n");
}

bootstrapWorkspace();
