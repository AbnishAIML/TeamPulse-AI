import { Router } from "express";
import { acceptInvitation } from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/accept", authenticate, acceptInvitation);

export default router;
