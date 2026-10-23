"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../src/config/db.js");
const User_js_1 = require("../src/models/User.js");
const Project_js_1 = require("../src/models/Project.js");
const Milestone_js_1 = require("../src/models/Milestone.js");
const Task_js_1 = require("../src/models/Task.js");
const Comment_js_1 = require("../src/models/Comment.js");
const ActivityEvent_js_1 = require("../src/models/ActivityEvent.js");
const Notification_js_1 = require("../src/models/Notification.js");
const seedDemoData = async () => {
    try {
        await (0, db_js_1.connectDB)();
        console.log("=================================================");
        console.log("[DEMO DATA] Initializing Explicit Demo Workspace...");
        console.log("=================================================");
        // Clean up ONLY existing @demo.local accounts
        const existingDemoUsers = await User_js_1.User.find({ email: /@demo\.local$/i });
        const demoUserIds = existingDemoUsers.map((u) => u._id);
        const demoProjects = await Project_js_1.Project.find({
            $or: [{ name: /\[DEMO DATA\]/i }, { ownerId: { $in: demoUserIds } }],
        });
        const demoProjectIds = demoProjects.map((p) => p._id);
        await Task_js_1.Task.deleteMany({ projectId: { $in: demoProjectIds } });
        await Milestone_js_1.Milestone.deleteMany({ projectId: { $in: demoProjectIds } });
        await Comment_js_1.Comment.deleteMany({ taskId: { $in: demoProjectIds } });
        await ActivityEvent_js_1.ActivityEvent.deleteMany({ projectId: { $in: demoProjectIds } });
        await Notification_js_1.Notification.deleteMany({ recipientId: { $in: demoUserIds } });
        await Project_js_1.Project.deleteMany({ _id: { $in: demoProjectIds } });
        await User_js_1.User.deleteMany({ _id: { $in: demoUserIds } });
        console.log("[DEMO DATA] Previous demo workspace wiped safely without touching real accounts.");
        // 1. Create Demo Users
        const passwordHash = await bcryptjs_1.default.hash("demo1234", 10);
        const lead = await User_js_1.User.create({
            name: "Alex Lead",
            email: "lead@demo.local",
            password: "demo1234",
            avatarColor: "blue",
            initials: "AL",
            systemRole: "user",
            title: "Project Lead [DEMO]",
            weeklyCapacityHours: 25,
            skills: ["Architecture", "React", "Node.js", "Project Planning"],
        });
        const dev1 = await User_js_1.User.create({
            name: "Sam Dev",
            email: "sam@demo.local",
            password: "demo1234",
            avatarColor: "violet",
            initials: "SD",
            systemRole: "user",
            title: "Backend Specialist [DEMO]",
            weeklyCapacityHours: 20,
            skills: ["Python", "FastAPI", "MongoDB", "Algorithms"],
        });
        const dev2 = await User_js_1.User.create({
            name: "Taylor Frontend",
            email: "taylor@demo.local",
            password: "demo1234",
            avatarColor: "pink",
            initials: "TF",
            systemRole: "user",
            title: "UI/UX Engineer [DEMO]",
            weeklyCapacityHours: 20,
            skills: ["React", "CSS", "UI/UX", "Data Visualizations"],
        });
        const reviewer = await User_js_1.User.create({
            name: "Morgan Reviewer",
            email: "morgan@demo.local",
            password: "demo1234",
            avatarColor: "green",
            initials: "MR",
            systemRole: "user",
            title: "QA & Code Reviewer [DEMO]",
            weeklyCapacityHours: 15,
            skills: ["Testing", "Code Quality", "Security Audit"],
        });
        console.log("[DEMO DATA] Created 4 demo accounts ending in @demo.local");
        // 2. Create Demo Project
        const now = new Date();
        const demoProject = await Project_js_1.Project.create({
            name: "TeamPulse Platform v1 [DEMO DATA]",
            code: "DEMO1",
            description: "Sample project demonstrating DAG dependency analysis, CPM critical path detection, and workload balancing.",
            ownerId: lead._id,
            status: "Active",
            startDate: new Date(now.getTime() - 7 * 86400000),
            targetDeadline: new Date(now.getTime() + 21 * 86400000),
            members: [
                { userId: lead._id, role: "Project Owner", weeklyCapacityHours: 25, skills: ["Architecture", "Planning"] },
                { userId: dev1._id, role: "Project Manager", weeklyCapacityHours: 20, skills: ["FastAPI", "MongoDB"] },
                { userId: dev2._id, role: "Team Member", weeklyCapacityHours: 20, skills: ["React", "CSS"] },
                { userId: reviewer._id, role: "Reviewer", weeklyCapacityHours: 15, skills: ["Testing", "QA"] },
            ],
            settings: {
                requireReviewForDone: true,
                productiveHoursPerDay: 6,
                overloadThresholdPct: 100,
                underloadThresholdPct: 40,
            },
        });
        console.log(`[DEMO DATA] Created project '${demoProject.name}'`);
        // 3. Create Milestones
        const m1 = await Milestone_js_1.Milestone.create({
            projectId: demoProject._id,
            title: "M1: Architecture & API Contracts [DEMO]",
            description: "Establish core REST APIs, WebSocket channels, and schema models.",
            dueDate: new Date(now.getTime() + 5 * 86400000),
            status: "In Progress",
            progressPct: 60,
        });
        const m2 = await Milestone_js_1.Milestone.create({
            projectId: demoProject._id,
            title: "M2: Analytics Engine & Dashboard [DEMO]",
            description: "Integrate DAG CPM scheduling, workload balancing, and health index.",
            dueDate: new Date(now.getTime() + 14 * 86400000),
            status: "Upcoming",
            progressPct: 15,
        });
        // 4. Create Tasks with Dependencies
        const taskArch = await Task_js_1.Task.create({
            projectId: demoProject._id,
            milestoneId: m1._id,
            title: "Define REST & WebSocket Data Schemas [DEMO]",
            description: "Finalize JSON schemas and Zod request/response validation.",
            status: "Done",
            priority: "High",
            assigneeId: lead._id,
            startDate: new Date(now.getTime() - 5 * 86400000),
            deadline: new Date(now.getTime() - 1 * 86400000),
            estimatedHours: 8,
            remainingHours: 0,
            actualHours: 8,
            completedAt: new Date(now.getTime() - 1 * 86400000),
            dependencies: [],
            tags: ["Backend", "Schema"],
        });
        const taskFastAPI = await Task_js_1.Task.create({
            projectId: demoProject._id,
            milestoneId: m1._id,
            title: "Implement FastAPI CPM and DAG Algorithms [DEMO]",
            description: "Build topological sort, critical path calculation, and slack metrics.",
            status: "In Progress",
            priority: "Critical",
            assigneeId: dev1._id,
            startDate: new Date(now.getTime() - 2 * 86400000),
            deadline: new Date(now.getTime() + 3 * 86400000),
            estimatedHours: 16,
            remainingHours: 10,
            actualHours: 6,
            dependencies: [taskArch._id],
            tags: ["Python", "FastAPI", "Algorithms"],
        });
        const taskUI = await Task_js_1.Task.create({
            projectId: demoProject._id,
            milestoneId: m2._id,
            title: "Design DAG Dependency Visualization Canvas [DEMO]",
            description: "Interactive visual dependency graph showing critical path and blocked tasks.",
            status: "Blocked",
            priority: "High",
            assigneeId: dev2._id,
            startDate: new Date(now.getTime() + 1 * 86400000),
            deadline: new Date(now.getTime() + 6 * 86400000),
            estimatedHours: 14,
            remainingHours: 14,
            actualHours: 0,
            dependencies: [taskFastAPI._id],
            tags: ["Frontend", "UI/UX", "Graph"],
            blocker: {
                isBlocked: true,
                reason: "Waiting for FastAPI CPM algorithm endpoints to stabilize.",
                reportedAt: now,
                reportedBy: dev2._id,
            },
        });
        const taskOverload = await Task_js_1.Task.create({
            projectId: demoProject._id,
            milestoneId: m2._id,
            title: "Analytics Service Load Testing & Optimizations [DEMO]",
            description: "Benchmark DAG matrix performance with up to 500 tasks.",
            status: "To Do",
            priority: "Medium",
            assigneeId: dev1._id, // Assign to dev1 to make them overloaded for demonstration
            startDate: new Date(now.getTime() + 2 * 86400000),
            deadline: new Date(now.getTime() + 8 * 86400000),
            estimatedHours: 18,
            remainingHours: 18,
            actualHours: 0,
            dependencies: [taskFastAPI._id],
            tags: ["Python", "Benchmarking"],
        });
        // 5. Activity Log
        await ActivityEvent_js_1.ActivityEvent.create({
            projectId: demoProject._id,
            taskId: taskArch._id,
            actorId: lead._id,
            eventType: "TASK_COMPLETED",
            summary: "Completed schema design and verified test fixtures.",
            createdAt: new Date(now.getTime() - 1 * 86400000),
        });
        await ActivityEvent_js_1.ActivityEvent.create({
            projectId: demoProject._id,
            taskId: taskUI._id,
            actorId: dev2._id,
            eventType: "BLOCKER_REPORTED",
            summary: "Reported blocker: Waiting for CPM endpoints.",
            createdAt: now,
        });
        console.log("=================================================");
        console.log("[DEMO DATA] Seed completed successfully!");
        console.log("  Demo Login: lead@demo.local / demo1234");
        console.log("  Project ID: " + demoProject._id);
        console.log("  Run 'npm run seed:reset' at any time to remove demo data.");
        console.log("=================================================");
        process.exit(0);
    }
    catch (error) {
        console.error("[DEMO DATA] Seed failed:", error);
        process.exit(1);
    }
};
exports.seedDemoData = seedDemoData;
(0, exports.seedDemoData)();
