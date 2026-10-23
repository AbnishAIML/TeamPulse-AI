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
  milestoneId?: Types.ObjectId;
  actorId: Types.ObjectId;
  eventType: ActivityEventType;
  summary: string;
  changes?: Record<string, { from: any; to: any }>;
  details?: Record<string, any>;
  meta?: Record<string, any>;
  createdAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: "Milestone", index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, required: true },
    summary: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
    details: { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityEventSchema.index({ projectId: 1, createdAt: -1 });

// Section 2.7: Append-only collection with Mongoose pre-hooks rejecting update/delete operations
const rejectMutation = function (this: any, next: (err?: Error) => void) {
  next(new Error("[Audit Rule Violation] ActivityEvent is strictly append-only. Modifications and deletions are rejected."));
};

ActivityEventSchema.pre("updateOne", rejectMutation);
ActivityEventSchema.pre("updateMany", rejectMutation);
ActivityEventSchema.pre("deleteOne", rejectMutation);
ActivityEventSchema.pre("deleteMany", rejectMutation);
ActivityEventSchema.pre("findOneAndDelete", rejectMutation);
ActivityEventSchema.pre("findOneAndUpdate", rejectMutation);
ActivityEventSchema.pre("findOneAndReplace", rejectMutation);

export const ActivityEvent = mongoose.model<IActivityEvent>("ActivityEvent", ActivityEventSchema);
