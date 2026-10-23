import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Milestone } from "../models/Milestone.js";
import { Task } from "../models/Task.js";
import { Comment } from "../models/Comment.js";
import { ActivityEvent } from "../models/ActivityEvent.js";
import { Notification } from "../models/Notification.js";

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("[Seed] Connected to database. Clearing existing demo data...");

    // Clear collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Milestone.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await ActivityEvent.deleteMany({});
    await Notification.deleteMany({});

    console.log("[Seed] Creating demo team users...");
    // 1. Create Users
    const ankit = await User.create({
      name: "Ankit Kumar",
      email: "ankit@teampulse.ai",
      password: "password123",
      avatarColor: "blue",
      initials: "AK",
      systemRole: "admin",
      title: "Project Lead & Architect",
      weeklyCapacityHours: 20,
      skills: ["System Architecture", "React", "TypeScript", "UI/UX"],
    });

    const rahul = await User.create({
      name: "Rahul Sharma",
      email: "rahul@teampulse.ai",
      password: "password123",
      avatarColor: "violet",
      initials: "RS",
      systemRole: "user",
      title: "Senior Backend Engineer",
      weeklyCapacityHours: 20,
      skills: ["Node.js", "Express", "MongoDB", "Python", "FastAPI"],
    });

    const priya = await User.create({
      name: "Priya Mehta",
      email: "priya@teampulse.ai",
      password: "password123",
      avatarColor: "pink",
      initials: "PM",
      systemRole: "user",
      title: "Frontend Engineer & UI Designer",
      weeklyCapacityHours: 20,
      skills: ["React", "CSS", "Recharts", "UI Design", "Tailwind CSS"],
    });

    const arjun = await User.create({
      name: "Arjun Verma",
      email: "arjun@teampulse.ai",
      password: "password123",
      avatarColor: "green",
      initials: "AV",
      systemRole: "user",
      title: "QA & Reliability Engineer",
      weeklyCapacityHours: 20,
      skills: ["Testing", "API Validation", "Code Review", "Documentation"],
    });

    console.log("[Seed] Creating demo project...");
    // 2. Create Project
    const now = new Date();
    const projectStartDate = new Date(now.getTime() - 14 * 86400000); // 14 days ago
    const projectTargetDeadline = new Date(now.getTime() + 21 * 86400000); // 21 days from now

    const project = await Project.create({
      name: "TeamPulse AI Platform",
      code: "TPAI",
      description: "Intelligent Project Management & Team Contribution Analysis Platform built for TechTrix'26.",
      objectives: [
        "Deliver reliable Finish-to-Start DAG dependency graph with Critical Path Method (CPM)",
        "Provide intelligent, capacity-driven workload rebalancing recommendations",
        "Implement transparent multi-signal team contribution metrics",
        "Enable real-time collaboration with Socket.IO alerts and audit tracking",
      ],
      startDate: projectStartDate,
      targetDeadline: projectTargetDeadline,
      status: "Active",
      ownerId: ankit._id,
      members: [
        { userId: ankit._id, role: "Project Owner", joinedAt: projectStartDate, weeklyCapacityHours: 20 },
        { userId: rahul._id, role: "Team Member", joinedAt: projectStartDate, weeklyCapacityHours: 20 },
        { userId: priya._id, role: "Team Member", joinedAt: projectStartDate, weeklyCapacityHours: 20 },
        { userId: arjun._id, role: "Reviewer", joinedAt: projectStartDate, weeklyCapacityHours: 20 },
      ],
    });

    console.log("[Seed] Creating demo milestones...");
    // 3. Create Milestones
    const m1 = await Milestone.create({
      projectId: project._id,
      title: "M1: Architecture & Foundation",
      description: "Core schemas, authentication layer, and design system setup",
      dueDate: new Date(now.getTime() - 5 * 86400000),
      completionCriteria: ["Database schemas verified", "JWT authentication working", "Base UI layout responsive"],
      status: "Completed",
      progressPct: 100,
      completedAt: new Date(now.getTime() - 5 * 86400000),
    });

    const m2 = await Milestone.create({
      projectId: project._id,
      title: "M2: Core API & Real-time Integration",
      description: "RESTful endpoints, task management views, and Socket.IO real-time channels",
      dueDate: new Date(now.getTime() + 4 * 86400000),
      completionCriteria: ["Kanban and Table views complete", "Real-time updates operational", "Blocker reporting functional"],
      status: "In Progress",
      progressPct: 65,
    });

    const m3 = await Milestone.create({
      projectId: project._id,
      title: "M3: Intelligent Analytics Engine",
      description: "DAG topological sort, CPM critical path, workload rebalancing, and contribution metrics",
      dueDate: new Date(now.getTime() + 12 * 86400000),
      completionCriteria: ["FastAPI service integrated", "Critical path highlighted", "Workload rebalancer active"],
      status: "In Progress",
      progressPct: 35,
    });

    const m4 = await Milestone.create({
      projectId: project._id,
      title: "M4: Production Demo & College Showcase",
      description: "Final verification, test suite execution, and presentation walkthrough",
      dueDate: projectTargetDeadline,
      completionCriteria: ["All test suites passing", "CSV reporting working", "Zero blocking defects"],
      status: "Planning",
      progressPct: 0,
    });

    console.log("[Seed] Creating demo tasks with dependencies, workloads, and blockers...");
    // 4. Create Tasks
    // Task 1: Done
    const t1 = await Task.create({
      projectId: project._id,
      milestoneId: m1._id,
      title: "Design database schema & Mongoose models",
      description: "Establish MongoDB collections for Users, Projects, Tasks, Milestones, and ActivityEvents.",
      assigneeId: rahul._id,
      priority: "Medium",
      status: "Done",
      startDate: projectStartDate,
      deadline: new Date(now.getTime() - 10 * 86400000),
      estimatedHours: 4,
      remainingHours: 0,
      actualHours: 4.5,
      completedAt: new Date(now.getTime() - 10 * 86400000),
      tags: ["Database", "Architecture"],
    });

    // Task 2: Done (Critical Path start)
    const t2 = await Task.create({
      projectId: project._id,
      milestoneId: m1._id,
      title: "Build authentication API with JWT & RBAC",
      description: "Implement secure registration, bcrypt password hashing, login, and project role checking middleware.",
      assigneeId: rahul._id,
      priority: "High",
      status: "Done",
      startDate: projectStartDate,
      deadline: new Date(now.getTime() - 7 * 86400000),
      estimatedHours: 6,
      remainingHours: 0,
      actualHours: 6,
      completedAt: new Date(now.getTime() - 7 * 86400000),
      tags: ["Auth", "Security", "Backend"],
    });

    // Task 3: In Progress (Rahul - 6h rem)
    const t3 = await Task.create({
      projectId: project._id,
      milestoneId: m2._id,
      title: "Develop real-time Socket.IO notification channel",
      description: "Set up WebSockets for task assignments, status changes, and project-wide blocker notifications.",
      assigneeId: rahul._id,
      priority: "High",
      status: "In Progress",
      startDate: new Date(now.getTime() - 3 * 86400000),
      deadline: new Date(now.getTime() + 1 * 86400000),
      estimatedHours: 6,
      remainingHours: 5,
      actualHours: 3,
      tags: ["Realtime", "Socket.IO", "Backend"],
    });

    // Task 4: In Progress (Rahul - 6h rem, depends on t2) [Critical path node]
    const t4 = await Task.create({
      projectId: project._id,
      milestoneId: m3._id,
      title: "Build DAG cycle detection and topological sort service",
      description: "Construct NetworkX directed graph in Python analytics engine to detect dependency loops and output task execution order.",
      assigneeId: rahul._id,
      priority: "Critical",
      status: "In Progress",
      startDate: new Date(now.getTime() - 1 * 86400000),
      deadline: new Date(now.getTime() + 4 * 86400000),
      estimatedHours: 7,
      remainingHours: 6,
      actualHours: 2,
      dependencies: [t2._id],
      tags: ["Analytics", "DAG", "Python"],
    });

    // Task 5: To Do (Rahul - 7h rem, depends on t4) [Critical path node]
    const t5 = await Task.create({
      projectId: project._id,
      milestoneId: m3._id,
      title: "Implement Critical Path Method (CPM) algorithm",
      description: "Compute early start, early finish, late start, late finish, and slack to accurately project project completion schedule.",
      assigneeId: rahul._id,
      priority: "Critical",
      status: "To Do",
      startDate: new Date(now.getTime() + 4 * 86400000),
      deadline: new Date(now.getTime() + 9 * 86400000),
      estimatedHours: 7,
      remainingHours: 7,
      actualHours: 0,
      dependencies: [t4._id],
      tags: ["Analytics", "CPM", "Algorithms"],
    });

    // Task 6: Done (Priya)
    const t6 = await Task.create({
      projectId: project._id,
      milestoneId: m2._id,
      title: "Design interactive Kanban board UI",
      description: "Create responsive drag-and-drop Kanban columns (Backlog, To Do, In Progress, In Review, Blocked, Done).",
      assigneeId: priya._id,
      priority: "Medium",
      status: "Done",
      startDate: new Date(now.getTime() - 6 * 86400000),
      deadline: new Date(now.getTime() - 2 * 86400000),
      estimatedHours: 5,
      remainingHours: 0,
      actualHours: 5,
      completedAt: new Date(now.getTime() - 2 * 86400000),
      tags: ["Frontend", "UI/UX", "Kanban"],
    });

    // Task 7: Blocked (Priya - 5h rem, depends on t3)
    const t7 = await Task.create({
      projectId: project._id,
      milestoneId: m2._id,
      title: "Connect dashboard charts with live analytics API",
      description: "Integrate Recharts with real-time project metrics stream and health indicators.",
      assigneeId: priya._id,
      priority: "High",
      status: "Blocked",
      startDate: new Date(now.getTime() - 2 * 86400000),
      deadline: new Date(now.getTime() + 2 * 86400000),
      estimatedHours: 6,
      remainingHours: 5,
      actualHours: 2,
      dependencies: [t3._id],
      blocker: {
        isBlocked: true,
        reason: "Predecessor Task 'Develop real-time Socket.IO notification channel' is still in progress; WebSocket schema needed.",
        severity: "High",
        reportedBy: priya._id,
        reportedAt: new Date(now.getTime() - 1 * 86400000),
      },
      tags: ["Frontend", "Recharts", "Integration"],
    });

    // Task 8: To Do (Priya - 4h rem, depends on t7) [Downstream at risk]
    const t8 = await Task.create({
      projectId: project._id,
      milestoneId: m3._id,
      title: "Implement task redistribution modal and approval workflow",
      description: "Build user-friendly dialog displaying advisory AI workload recommendations with 1-click approve/apply action.",
      assigneeId: priya._id,
      priority: "Medium",
      status: "To Do",
      startDate: new Date(now.getTime() + 2 * 86400000),
      deadline: new Date(now.getTime() + 6 * 86400000),
      estimatedHours: 4,
      remainingHours: 4,
      actualHours: 0,
      dependencies: [t7._id],
      tags: ["Frontend", "Workload", "UI"],
    });

    // Task 9: Done (Arjun)
    const t9 = await Task.create({
      projectId: project._id,
      milestoneId: m1._id,
      title: "Write integration test suite for REST APIs",
      description: "Automate API testing for authentication, project creation, and task status validation.",
      assigneeId: arjun._id,
      priority: "Medium",
      status: "Done",
      startDate: new Date(now.getTime() - 8 * 86400000),
      deadline: new Date(now.getTime() - 4 * 86400000),
      estimatedHours: 4,
      remainingHours: 0,
      actualHours: 4,
      completedAt: new Date(now.getTime() - 4 * 86400000),
      tags: ["Testing", "QA"],
    });

    // Task 10: In Review (Arjun - 3h rem)
    const t10 = await Task.create({
      projectId: project._id,
      milestoneId: m3._id,
      title: "Review & approve analytics bridge data contracts",
      description: "Inspect Pydantic and TypeScript interfaces to guarantee seamless communication between Node.js and FastAPI.",
      assigneeId: arjun._id,
      priority: "High",
      status: "In Review",
      startDate: new Date(now.getTime() - 1 * 86400000),
      deadline: new Date(now.getTime() + 3 * 86400000),
      estimatedHours: 4,
      remainingHours: 3,
      actualHours: 2,
      review: {
        status: "Pending Review",
        feedback: "Submitted for final QA sign-off before analytics deployment.",
        requestedAt: new Date(now.getTime() - 1 * 86400000),
      },
      tags: ["QA", "Review", "Analytics"],
    });

    // Task 11: To Do (Arjun - 3h rem)
    const t11 = await Task.create({
      projectId: project._id,
      milestoneId: m2._id,
      title: "Verify CSV export formatting and download headers",
      description: "Test CSV generation across tasks, milestones, and workload reports with special character handling.",
      assigneeId: arjun._id,
      priority: "Low",
      status: "To Do",
      startDate: new Date(now.getTime() + 3 * 86400000),
      deadline: new Date(now.getTime() + 7 * 86400000),
      estimatedHours: 3,
      remainingHours: 3,
      actualHours: 0,
      tags: ["Testing", "Reports"],
    });

    // Task 12: Overdue Task (Rahul - 6h rem, High priority overdue)
    // Rahul total remaining hours = 5 (t3) + 6 (t4) + 7 (t5) + 6 (t12) = 24h! Overloaded (24h/20h = 120%)!
    const t12 = await Task.create({
      projectId: project._id,
      milestoneId: m2._id,
      title: "Optimize database query indexes for high-frequency queries",
      description: "Analyze MongoDB explain plans and add compound indexes for project tasks and activity filtering.",
      assigneeId: rahul._id,
      priority: "High",
      status: "To Do",
      startDate: new Date(now.getTime() - 5 * 86400000),
      deadline: new Date(now.getTime() - 2 * 86400000), // 2 days overdue!
      estimatedHours: 6,
      remainingHours: 6,
      actualHours: 1,
      tags: ["Database", "Optimization", "Backend"],
    });

    // Task 13: Ankit (Owner - 4h rem)
    const t13 = await Task.create({
      projectId: project._id,
      milestoneId: m4._id,
      title: "Draft college project presentation and architecture slides",
      description: "Prepare comprehensive demonstration slides covering DAG algorithms, CPM, and team contribution analysis.",
      assigneeId: ankit._id,
      priority: "High",
      status: "In Progress",
      startDate: new Date(now.getTime() - 2 * 86400000),
      deadline: new Date(now.getTime() + 10 * 86400000),
      estimatedHours: 6,
      remainingHours: 4,
      actualHours: 3,
      tags: ["Documentation", "Presentation"],
    });

    console.log("[Seed] Creating demo comments and discussions...");
    // 5. Create Comments
    await Comment.create({
      taskId: t7._id,
      projectId: project._id,
      authorId: priya._id,
      text: "I've drafted the chart components in Recharts, but currently blocked until the live WebSocket payload schema is finalized.",
    });

    await Comment.create({
      taskId: t7._id,
      projectId: project._id,
      authorId: rahul._id,
      text: "Understood Priya! I'm wrapping up the Socket.IO event handler in Task 3 today and will share the event schema shortly.",
    });

    await Comment.create({
      taskId: t7._id,
      projectId: project._id,
      authorId: ankit._id,
      text: "Thanks for flagging this early! Let's prioritize unblocking Task 7 so Priya can connect the dashboard graphs.",
    });

    console.log("[Seed] Creating demo audit activity events...");
    // 6. Create Activity Events
    await ActivityEvent.create({
      projectId: project._id,
      actorId: ankit._id,
      eventType: "WORKLOAD_REBALANCED",
      summary: "Created project 'TeamPulse AI Platform'",
      createdAt: projectStartDate,
    });

    await ActivityEvent.create({
      projectId: project._id,
      taskId: t1._id,
      actorId: rahul._id,
      eventType: "TASK_COMPLETED",
      summary: "Completed task 'Design database schema & Mongoose models'",
      createdAt: new Date(now.getTime() - 10 * 86400000),
    });

    await ActivityEvent.create({
      projectId: project._id,
      taskId: t2._id,
      actorId: rahul._id,
      eventType: "TASK_COMPLETED",
      summary: "Completed task 'Build authentication API with JWT & RBAC'",
      createdAt: new Date(now.getTime() - 7 * 86400000),
    });

    await ActivityEvent.create({
      projectId: project._id,
      taskId: t6._id,
      actorId: priya._id,
      eventType: "TASK_COMPLETED",
      summary: "Completed task 'Design interactive Kanban board UI'",
      createdAt: new Date(now.getTime() - 2 * 86400000),
    });

    await ActivityEvent.create({
      projectId: project._id,
      taskId: t7._id,
      actorId: priya._id,
      eventType: "BLOCKER_REPORTED",
      summary: "Blocker reported on 'Connect dashboard charts with live analytics API': Awaiting Socket.IO live analytics event schema",
      createdAt: new Date(now.getTime() - 1 * 86400000),
    });

    await ActivityEvent.create({
      projectId: project._id,
      taskId: t10._id,
      actorId: arjun._id,
      eventType: "REVIEW_REQUESTED",
      summary: "Review requested for 'Review & approve analytics bridge data contracts'",
      createdAt: new Date(now.getTime() - 1 * 86400000),
    });

    console.log("[Seed] Creating demo notifications...");
    // 7. Create Notifications
    await Notification.create({
      recipientId: ankit._id,
      projectId: project._id,
      taskId: t7._id,
      type: "BLOCKER_ALERT",
      title: "Blocker on Connect dashboard charts",
      message: "Priya Mehta reported a High severity blocker: Awaiting Socket.IO live analytics event schema.",
      isRead: false,
    });

    await Notification.create({
      recipientId: ankit._id,
      projectId: project._id,
      taskId: t12._id,
      type: "OVERDUE_ALERT",
      title: "High Priority Task Overdue",
      message: "Task 'Optimize database query indexes' is 2 days past deadline.",
      isRead: false,
    });

    await Notification.create({
      recipientId: rahul._id,
      projectId: project._id,
      taskId: t12._id,
      type: "OVERDUE_ALERT",
      title: "Task Overdue Notice",
      message: "Your assigned task 'Optimize database query indexes' is overdue.",
      isRead: false,
    });

    await Notification.create({
      recipientId: arjun._id,
      projectId: project._id,
      taskId: t10._id,
      type: "REVIEW_REQUEST",
      title: "Review Required",
      message: "You have deliverable 'Review & approve analytics bridge data contracts' awaiting sign-off.",
      isRead: false,
    });

    console.log("\n=======================================================");
    console.log("DEMO DATABASE SEEDED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Demo Accounts (Password for all: password123):");
    console.log("1. ankit@teampulse.ai  - Project Lead / Admin");
    console.log("2. rahul@teampulse.ai  - Lead Dev (Overloaded: 24h / 20h)");
    console.log("3. priya@teampulse.ai  - Frontend Engineer (Has blocked task)");
    console.log("4. arjun@teampulse.ai  - QA / Reviewer (Underutilized: 9h / 20h)");
    console.log("Project: TeamPulse AI Platform (TPAI)");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("[Seed] Seeding failed:", err);
    process.exit(1);
  }
};

// Execute if run directly
seedDatabase();
