import mongoose, { Document, Schema, Types } from "mongoose";

export type ActivityEventType =
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_REASSIGNED"
  | "STATUS_CHANGED"
  | "DEADLINE_CHANGED"
  | "EFFORT_UPDATED"
  | "BLOCKER_REPORTED"
  | "BLOCKER_RESOLVED"
  | "COMMENT_ADDED"
  | "REVIEW_REQUESTED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "TASK_COMPLETED"
  | "TASK_REOPENED"
  | "DEPENDENCY_ADDED"
  | "DEPENDENCY_REMOVED"
  | "WORKLOAD_REBALANCED";

export interface IActivityEvent extends Document {
  projectId: Types.ObjectId;
  taskId?: Types.ObjectId;
  actorId: Types.ObjectId;
  eventType: ActivityEventType;
  summary: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, required: true },
    summary: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityEventSchema.index({ projectId: 1, createdAt: -1 });

export const ActivityEvent = mongoose.model<IActivityEvent>("ActivityEvent", ActivityEventSchema);
