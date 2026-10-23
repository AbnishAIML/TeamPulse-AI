import { Router } from "express";
import { getReportSummary, exportReportCSV } from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";
import { requireProjectMember } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/projects/:projectId/reports/summary", requireProjectMember, getReportSummary);
router.get("/projects/:projectId/reports/export-csv", requireProjectMember, exportReportCSV);

export default router;
