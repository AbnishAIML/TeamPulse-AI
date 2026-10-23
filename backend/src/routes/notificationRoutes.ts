import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/notifications", getNotifications);
router.patch("/notifications/:notificationId/read", markAsRead);
router.patch("/notifications/read-all", markAllAsRead);

export default router;
