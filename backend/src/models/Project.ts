import mongoose, { Document, Schema, Types } from "mongoose";

export type ProjectRole = "Project Owner" | "Project Manager" | "Team Member" | "Reviewer";

export interface IProjectMember {
  userId: Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
  weeklyCapacityHours?: number;
}

export interface IProject extends Document {
  name: string;
  code: string;
  description: string;
  objectives: string[];
  startDate: Date;
  targetDeadline: Date;
  status: "Planning" | "Active" | "On Hold" | "Completed" | "Archived";
  ownerId: Types.ObjectId;
  members: IProjectMember[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["Project Owner", "Project Manager", "Team Member", "Reviewer"],
      default: "Team Member",
    },
    joinedAt: { type: Date, default: Date.now },
    weeklyCapacityHours: { type: Number, default: 20 },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    objectives: { type: [String], default: [] },
    startDate: { type: Date, default: Date.now },
    targetDeadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed", "Archived"],
      default: "Active",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [ProjectMemberSchema], default: [] },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ "members.userId": 1 });

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
