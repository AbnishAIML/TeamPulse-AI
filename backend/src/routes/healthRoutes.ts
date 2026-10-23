import { Router } from "express";
import { getProjectHealth } from "../controllers/healthController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/health", requireProjectMember, getProjectHealth);

export default router;
