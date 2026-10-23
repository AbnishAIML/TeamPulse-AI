import mongoose, { Document, Schema, Types } from "mongoose";

export interface IComment extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  authorId: Types.ObjectId;
  text: string;
  batchMarker?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    batchMarker: { type: String, select: false, index: true },
  },
  { timestamps: true }
);

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
