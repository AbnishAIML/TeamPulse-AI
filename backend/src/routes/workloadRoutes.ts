import { Router } from "express";
import { getProjectWorkload, applyRedistribution } from "../controllers/workloadController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectRole, requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/workload", requireProjectMember, getProjectWorkload);
router.post(
  "/projects/:projectId/workload/reassign",
  requireProjectRole(["Project Owner", "Project Manager"]),
  applyRedistribution
);

export default router;
