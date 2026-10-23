import { Types } from "mongoose";
import { ActivityEvent, ActivityEventType } from "../models/ActivityEvent.js";
import { emitToProject } from "./socketService.js";

interface LogActivityParams {
  projectId: string | Types.ObjectId;
  taskId?: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  eventType: ActivityEventType;
  summary: string;
  details?: Record<string, any>;
  createdAt?: Date;
  batchMarker?: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    const event = await ActivityEvent.create({
      projectId: params.projectId,
      taskId: params.taskId,
      actorId: params.actorId,
      eventType: params.eventType,
      summary: params.summary,
      details: params.details || {},
      createdAt: params.createdAt || new Date(),
      batchMarker: params.batchMarker,
    });

    const populated = await ActivityEvent.findById(event._id).populate("actorId", "name initials avatarColor");
    
    // Emit real-time activity to project channel
    emitToProject(params.projectId.toString(), "activity:new", populated);
  } catch (err) {
    console.error("[ActivityService] Failed to log activity:", err);
  }
};
