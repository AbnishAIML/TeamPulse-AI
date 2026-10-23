import dotenv from "dotenv";
import path from "path";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "teampulse_ai_super_secret_jwt_key_2026");
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("[FATAL] JWT_SECRET environment variable is required at boot in production.");
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/teampulse_db",
  JWT_SECRET: JWT_SECRET || "teampulse_ai_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_SECRET: process.env.REFRESH_SECRET || "teampulse_ai_refresh_secret_key_2026",
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || "30d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8000",
  ANALYTICS_TIMEOUT_MS: process.env.ANALYTICS_TIMEOUT_MS ? parseInt(process.env.ANALYTICS_TIMEOUT_MS, 10) : 3500,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || "local",
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB ? parseInt(process.env.MAX_UPLOAD_MB, 10) : 10,
  ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/webp,application/pdf,text/plain,application/zip").split(","),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "no-reply@teampulse.ai",
};
