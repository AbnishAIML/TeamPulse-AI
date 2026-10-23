import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./services/socketService.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dependencyRoutes from "./routes/dependencyRoutes.js";
import workloadRoutes from "./routes/workloadRoutes.js";
import contributionRoutes from "./routes/contributionRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, ENV.CLIENT_URL);

// Standard Middlewares
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads securely
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health route
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "TeamPulse AI Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", milestoneRoutes);
app.use("/api", taskRoutes);
app.use("/api", dependencyRoutes);
app.use("/api", workloadRoutes);
app.use("/api", contributionRoutes);
app.use("/api", healthRoutes);
app.use("/api", commentRoutes);
app.use("/api", reviewRoutes);
app.use("/api", attachmentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);
app.use("/api/invitations", invitationRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  server.listen(ENV.PORT, () => {
    console.log(`[TeamPulse Backend] Server running on http://localhost:${ENV.PORT}`);
    console.log(`[TeamPulse Backend] Real-time Socket.IO connected and listening.`);
  });
};

startServer();

export { app, server };
