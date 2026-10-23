import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
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
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
