import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITaskDependency extends Document {
  projectId: Types.ObjectId;
  predecessorId: Types.ObjectId;
  successorId: Types.ObjectId;
  createdAt: Date;
}

const TaskDependencySchema = new Schema<ITaskDependency>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    predecessorId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    successorId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Section 2.3: Unique compound index on {predecessorId, successorId, projectId}
TaskDependencySchema.index(
  { predecessorId: 1, successorId: 1, projectId: 1 },
  { unique: true }
);

export const TaskDependency = mongoose.model<ITaskDependency>("TaskDependency", TaskDependencySchema);
