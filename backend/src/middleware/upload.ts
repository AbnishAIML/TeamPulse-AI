import multer from "multer";
import path from "path";
import fs from "fs";
import { ENV } from "../config/env.js";

// Ensure uploads directory exists
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ENV.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".php", ".vbs", ".msi", ".com", ".scr"];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return cb(new Error("Executable or script files are prohibited for security."));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Generous 100MB per file to avoid arbitrary user blocking
  },
});

