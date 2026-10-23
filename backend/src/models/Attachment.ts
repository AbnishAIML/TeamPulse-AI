import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttachment extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  uploaderId: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    filePath: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = mongoose.model<IAttachment>("Attachment", AttachmentSchema);
