import { Router } from "express";
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestoneController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectRole, requireProjectMember, requireMilestoneMember } from "../middleware/rbac.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/projects/:projectId/milestones", requireProjectMember, getMilestones);
router.post(
  "/projects/:projectId/milestones",
  requireProjectRole(["Project Owner", "Project Manager"]),
  createMilestone
);
router.put("/milestones/:milestoneId", requireMilestoneMember, updateMilestone);
router.delete("/milestones/:milestoneId", requireMilestoneMember, deleteMilestone);

export default router;
