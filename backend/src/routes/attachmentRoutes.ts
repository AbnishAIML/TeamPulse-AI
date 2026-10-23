import { Router } from "express";
import { getTaskAttachments, uploadAttachment, downloadAttachment } from "../controllers/attachmentController.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);

router.get("/tasks/:taskId/attachments", getTaskAttachments);
router.post("/tasks/:taskId/attachments", upload.single("file"), uploadAttachment);
router.get("/attachments/:attachmentId/download", downloadAttachment);

export default router;
