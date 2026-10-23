import { Router } from "express";
import {
  getProjectDependencies,
  addDependency,
  removeDependency,
} from "../controllers/dependencyController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectMember, requireTaskMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/dependencies", requireProjectMember, getProjectDependencies);
router.post("/tasks/:taskId/dependencies", requireTaskMember, addDependency);
router.delete("/tasks/:taskId/dependencies/:predecessorId", requireTaskMember, removeDependency);

export default router;
