import { Router } from "express";
import { getTaskComments, addComment } from "../controllers/commentController.js";
import { authenticate } from "../middleware/auth.js";
import { requireTaskMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/tasks/:taskId/comments", requireTaskMember, getTaskComments);
router.post("/tasks/:taskId/comments", requireTaskMember, addComment);

export default router;
