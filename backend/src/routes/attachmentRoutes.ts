import { Router } from "express";
import { getTaskAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from "../controllers/attachmentController.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);

router.get("/tasks/:taskId/attachments", getTaskAttachments);
router.post("/tasks/:taskId/attachments", upload.single("file"), uploadAttachment);
router.get("/attachments/:attachmentId/download", downloadAttachment);
router.delete("/attachments/:attachmentId", deleteAttachment);

export default router;
