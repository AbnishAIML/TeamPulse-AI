import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addMember,
  updateMemberRole,
  removeMember,
  deleteProject,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectRole, requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:projectId", requireProjectMember, getProjectById);
router.put("/:projectId", requireProjectRole(["Project Owner", "Project Manager"]), updateProject);
router.delete("/:projectId", requireProjectRole(["Project Owner"]), deleteProject);

// Member management
router.post("/:projectId/members", requireProjectRole(["Project Owner", "Project Manager"]), addMember);
router.put("/:projectId/members/:memberId", requireProjectRole(["Project Owner", "Project Manager"]), updateMemberRole);
router.delete("/:projectId/members/:memberId", requireProjectRole(["Project Owner"]), removeMember);

export default router;
