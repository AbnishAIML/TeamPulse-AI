import { Router } from "express";
import {
  getProjectDependencies,
  simulateTaskDelay,
  addDependency,
  removeDependency,
} from "../controllers/dependencyController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectMember, requireTaskMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/dependencies", requireProjectMember, getProjectDependencies);
router.post("/projects/:projectId/dependencies/simulate-delay", requireProjectMember, simulateTaskDelay);
router.post("/tasks/:taskId/dependencies", requireTaskMember, addDependency);
router.delete("/tasks/:taskId/dependencies/:predecessorId", requireTaskMember, removeDependency);

export default router;
