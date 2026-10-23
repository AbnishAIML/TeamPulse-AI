import mongoose, { Document, Schema, Types } from "mongoose";

export type BlockerSeverity = "Low" | "Medium" | "High" | "Critical";

export interface IBlocker extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  severity: BlockerSeverity;
  description: string;
  status: "Open" | "Resolved";
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const BlockerSchema = new Schema<IBlocker>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Blocker = mongoose.model<IBlocker>("Blocker", BlockerSchema);
