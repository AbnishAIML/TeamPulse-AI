import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  createInvitation,
  getInvitations,
  revokeInvitation,
  acceptInvitation,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectRole, requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

// Project lifecycle
router.get("/", getProjects);
router.post("/", createProject);
router.get("/:projectId", requireProjectMember, getProjectById);
router.put("/:projectId", requireProjectRole(["Project Owner"]), updateProject);
router.delete("/:projectId", requireProjectRole(["Project Owner"]), deleteProject);

// Member management (Owner only per Section 2.1)
router.post("/:projectId/members", requireProjectRole(["Project Owner"]), addMember);
router.put("/:projectId/members/:memberId", requireProjectRole(["Project Owner"]), updateMemberRole);
router.delete("/:projectId/members/:memberId", requireProjectRole(["Project Owner"]), removeMember);

// Invitations (Owner and Manager can invite collaborators)
router.post("/:projectId/invitations", requireProjectRole(["Project Owner", "Project Manager"]), createInvitation);
router.get("/:projectId/invitations", requireProjectRole(["Project Owner", "Project Manager"]), getInvitations);
router.delete("/:projectId/invitations/:invitationId", requireProjectRole(["Project Owner", "Project Manager"]), revokeInvitation);

// Accept invitation
router.post("/invitations/accept", acceptInvitation);

export default router;
