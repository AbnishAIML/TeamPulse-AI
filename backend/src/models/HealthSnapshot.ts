import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHealthFactor {
  name: string;
  score: number;
  weight: number;
  impact: string;
  detail: string;
}

export interface IHealthSnapshot extends Document {
  projectId: Types.ObjectId;
  healthScore: number;
  riskLevel: string;
  factors: IHealthFactor[];
  snapshotDate: Date;
  createdAt: Date;
}

const FactorSchema = new Schema<IHealthFactor>(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    impact: { type: String, default: "" },
    detail: { type: String, default: "" },
  },
  { _id: false }
);

const HealthSnapshotSchema = new Schema<IHealthSnapshot>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    healthScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    factors: { type: [FactorSchema], default: [] },
    snapshotDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

HealthSnapshotSchema.index({ projectId: 1, snapshotDate: -1 });

export const HealthSnapshot = mongoose.model<IHealthSnapshot>("HealthSnapshot", HealthSnapshotSchema);
