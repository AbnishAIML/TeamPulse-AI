import { Router } from "express";
import { requestReview, reviewDecision } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/tasks/:taskId/review/request", requestReview);
router.post("/tasks/:taskId/review/decision", reviewDecision);

export default router;
