import mongoose, { Document, Schema, Types } from "mongoose";
import { ReviewStatus } from "./Task.js";

export interface IReview extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  reviewer?: Types.ObjectId;
  status: ReviewStatus;
  notes?: string;
  feedback?: string;
  requestedAt: Date;
  decidedAt?: Date;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewer: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["None", "Pending Review", "Approved", "Changes Requested"],
      default: "Pending Review",
      index: true,
    },
    notes: { type: String, default: "" },
    feedback: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
