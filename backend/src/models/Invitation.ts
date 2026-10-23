import mongoose, { Document, Schema, Types } from "mongoose";
import { ProjectRole } from "./Project.js";

export interface IInvitation extends Document {
  token: string;
  projectId: Types.ObjectId;
  email: string;
  role: ProjectRole;
  inviterId: Types.ObjectId;
  expiresAt: Date;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    token: { type: String, required: true, unique: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ["Project Owner", "Project Manager", "Team Member", "Reviewer"],
      default: "Team Member",
    },
    inviterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InvitationSchema.index({ projectId: 1, email: 1, status: 1 });

export const Invitation = mongoose.model<IInvitation>("Invitation", InvitationSchema);
