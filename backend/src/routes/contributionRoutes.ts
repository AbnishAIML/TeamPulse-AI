import { Router } from "express";
import { getProjectContributions, getProjectActivity } from "../controllers/contributionController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/contributions", requireProjectMember, getProjectContributions);
router.get("/projects/:projectId/activity", requireProjectMember, getProjectActivity);

export default router;
