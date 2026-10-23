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
import { requireProjectMember, requireTaskMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/tasks", requireProjectMember, getTasks);
router.post("/projects/:projectId/tasks", requireProjectMember, createTask);
router.get("/tasks/:taskId", requireTaskMember, getTaskById);
router.put("/tasks/:taskId", requireTaskMember, updateTask);
router.patch("/tasks/:taskId/status", requireTaskMember, updateTaskStatus);
router.post("/tasks/:taskId/blocker", requireTaskMember, reportBlocker);
router.post("/tasks/:taskId/resolve-blocker", requireTaskMember, resolveBlocker);
router.delete("/tasks/:taskId", requireTaskMember, deleteTask);

export default router;
