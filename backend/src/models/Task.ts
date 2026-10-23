import mongoose, { Document, Schema, Types } from "mongoose";

export type TaskStatus = "Backlog" | "To Do" | "In Progress" | "In Review" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type ReviewStatus = "None" | "Pending Review" | "Approved" | "Changes Requested";

export interface ITaskBlocker {
  isBlocked: boolean;
  reason?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  reportedBy?: Types.ObjectId;
  reportedAt?: Date;
  resolvedAt?: Date;
}

export interface ITaskReview {
  status: ReviewStatus;
  reviewerId?: Types.ObjectId;
  feedback?: string;
  requestedAt?: Date;
  reviewedAt?: Date;
}

export interface ITask extends Document {
  projectId: Types.ObjectId;
  milestoneId?: Types.ObjectId;
  title: string;
  description: string;
  assigneeId?: Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: Date;
  deadline?: Date;
  estimatedHours: number;
  remainingHours: number;
  actualHours: number;
  dependencies: Types.ObjectId[]; // Predecessor tasks that must finish before this task starts
  tags: string[];
  blocker: ITaskBlocker;
  review: ITaskReview;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlockerSchema = new Schema<ITaskBlocker>(
  {
    isBlocked: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reportedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { _id: false }
);

const ReviewSchema = new Schema<ITaskReview>(
  {
    status: {
      type: String,
      enum: ["None", "Pending Review", "Approved", "Changes Requested"],
      default: "None",
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    feedback: { type: String, default: "" },
    requestedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: "Milestone", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Backlog", "To Do", "In Progress", "In Review", "Blocked", "Done"],
      default: "To Do",
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    estimatedHours: { type: Number, default: 0, min: 0 },
    remainingHours: { type: Number, default: 0, min: 0 },
    actualHours: { type: Number, default: 0, min: 0 },
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    tags: { type: [String], default: [] },
    blocker: { type: BlockerSchema, default: () => ({ isBlocked: false }) },
    review: { type: ReviewSchema, default: () => ({ status: "None" }) },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, deadline: 1 });

export const Task = mongoose.model<ITask>("Task", TaskSchema);
