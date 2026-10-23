import { Router } from "express";
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestoneController.js";
import { authenticate } from "../middleware/auth.js";
import {
  requireProjectRole,
  requireProjectMember,
  requireMilestoneRole,
} from "../middleware/rbac.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

// View milestones (all project members)
router.get("/projects/:projectId/milestones", requireProjectMember, getMilestones);

// Create milestone (Owner and Manager only)
router.post(
  "/projects/:projectId/milestones",
  requireProjectRole(["Project Owner", "Project Manager"]),
  createMilestone
);

// Update milestone (Owner and Manager only)
router.put(
  "/milestones/:milestoneId",
  requireMilestoneRole(["Project Owner", "Project Manager"]),
  updateMilestone
);

// Delete milestone (Owner and Manager only)
router.delete(
  "/milestones/:milestoneId",
  requireMilestoneRole(["Project Owner", "Project Manager"]),
  deleteMilestone
);

export default router;
