import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/teampulse_db",
  JWT_SECRET: process.env.JWT_SECRET || "teampulse_ai_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8000",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  UPLOAD_DIR: path.join(process.cwd(), "uploads"),
};
