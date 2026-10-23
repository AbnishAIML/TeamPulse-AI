import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMilestone extends Document {
  projectId: Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  completionCriteria: string[];
  status: "Planning" | "In Progress" | "Completed" | "Overdue";
  progressPct: number;
  completedAt?: Date;
  batchMarker?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, required: true },
    completionCriteria: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "Completed", "Overdue"],
      default: "Planning",
    },
    progressPct: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date },
    batchMarker: { type: String, select: false, index: true },
  },
  { timestamps: true }
);

export const Milestone = mongoose.model<IMilestone>("Milestone", MilestoneSchema);
