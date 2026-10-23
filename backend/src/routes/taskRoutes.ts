import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  reportBlocker,
  resolveBlocker,
  deleteTask,
} from "../controllers/taskController.js";
import { authenticate } from "../middleware/auth.js";
import {
  requireProjectMember,
  requireTaskMember,
  requireTaskPermission,
} from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

// View tasks
router.get("/projects/:projectId/tasks", requireProjectMember, getTasks);
router.get("/tasks/:taskId", requireTaskMember, getTaskById);

// Create task (Owner, Manager, Member only; Reviewer forbidden)
router.post("/projects/:projectId/tasks", requireTaskPermission("create"), createTask);

// Edit task (Owner/Manager full; Member assigned only & progress fields; Reviewer forbidden)
router.put("/tasks/:taskId", requireTaskPermission("edit"), updateTask);

// Update status & blockers (Owner/Manager/Member; Reviewer forbidden)
router.patch("/tasks/:taskId/status", requireTaskPermission("status"), updateTaskStatus);
router.post("/tasks/:taskId/blocker", requireTaskPermission("status"), reportBlocker);
router.post("/tasks/:taskId/resolve-blocker", requireTaskPermission("status"), resolveBlocker);

// Delete task (Owner and Manager only; Member & Reviewer forbidden)
router.delete("/tasks/:taskId", requireTaskPermission("delete"), deleteTask);

export default router;
