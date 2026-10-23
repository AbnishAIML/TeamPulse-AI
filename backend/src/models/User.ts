import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarColor: string;
  initials: string;
  systemRole: "admin" | "user";
  weeklyCapacityHours: number;
  title: string;
  skills: string[];
  refreshTokenHash?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatarColor: { type: String, default: "blue" },
    initials: { type: String, default: "TP" },
    systemRole: { type: String, enum: ["admin", "user"], default: "user" },
    weeklyCapacityHours: { type: Number, default: 20 },
    title: { type: String, default: "Software Engineer" },
    skills: { type: [String], default: [] },
    refreshTokenHash: { type: String, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
