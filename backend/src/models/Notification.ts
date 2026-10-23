import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "assigned"
  | "reassigned"
  | "status_changed"
  | "comment_added"
  | "blocker_reported"
  | "dependency_blocked"
  | "deadline_changed"
  | "milestone_changed"
  | "review_requested"
  | "review_completed"
  | "risk_changed"
  | "overdue"
  | "deadline_soon"
  | "blocker_unresolved"
  | "review_pending"
  | "recommendation_proposed"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "BLOCKER_ALERT"
  | "REVIEW_REQUEST"
  | "REVIEW_RESULT"
  | "OVERDUE_ALERT"
  | "WORKLOAD_ALERT";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  entityId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  dedupKey?: string;
  isRead: boolean;
  readAt?: Date;
  batchMarker?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    entityId: { type: Schema.Types.ObjectId },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dedupKey: { type: String, unique: true, sparse: true, index: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    batchMarker: { type: String, select: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
