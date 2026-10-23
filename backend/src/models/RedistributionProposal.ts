import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRedistributionProposal extends Document {
  projectId: Types.ObjectId;
  taskId: Types.ObjectId;
  currentAssigneeId: Types.ObjectId;
  proposedAssigneeId: Types.ObjectId;
  reason: string;
  beforeUtilizationCurrent: number;
  afterUtilizationCurrent: number;
  beforeUtilizationProposed: number;
  afterUtilizationProposed: number;
  score: number;
  confidence: number;
  status: "proposed" | "approved" | "rejected";
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
}

const RedistributionProposalSchema = new Schema<IRedistributionProposal>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    currentAssigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proposedAssigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    beforeUtilizationCurrent: { type: Number, required: true },
    afterUtilizationCurrent: { type: Number, required: true },
    beforeUtilizationProposed: { type: Number, required: true },
    afterUtilizationProposed: { type: Number, required: true },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0.8 },
    status: {
      type: String,
      enum: ["proposed", "approved", "rejected"],
      default: "proposed",
      index: true,
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const RedistributionProposal = mongoose.model<IRedistributionProposal>(
  "RedistributionProposal",
  RedistributionProposalSchema
);
