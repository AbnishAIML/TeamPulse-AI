import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, IUser } from "../models/User.js";
import { ENV } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateTokens = (userId: string) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
  const refreshToken = jwt.sign({ id: userId, jti }, ENV.REFRESH_SECRET, {
    expiresIn: ENV.REFRESH_EXPIRES_IN as any,
  });
  const refreshTokenHash = hashToken(refreshToken);
  return { token, refreshToken, refreshTokenHash };
};

const formatUser = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  initials: user.initials,
  avatarColor: user.avatarColor,
  systemRole: user.systemRole,
  title: user.title,
  weeklyCapacityHours: user.weeklyCapacityHours,
  skills: user.skills,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, title, weeklyCapacityHours, skills } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required." });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: "User with this email already exists." });
      return;
    }

    const initials = name
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const colors = ["blue", "violet", "pink", "green", "orange"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      initials: initials || "TP",
      avatarColor,
      title: title || "Software Engineer",
      weeklyCapacityHours: weeklyCapacityHours ? Number(weeklyCapacityHours) : 20,
      skills: Array.isArray(skills) ? skills : [],
      batchMarker: req.body.batchMarker || undefined,
    });

    const { token, refreshToken, refreshTokenHash } = generateTokens(user._id.toString());
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: formatUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Registration failed.", error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      console.warn(`[Security Audit] Failed login attempt: user '${email.toLowerCase().trim()}' not found from IP '${req.ip || "unknown"}' at ${new Date().toISOString()}`);
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[Security Audit] Failed login attempt: incorrect password for '${email.toLowerCase().trim()}' from IP '${req.ip || "unknown"}' at ${new Date().toISOString()}`);
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const { token, refreshToken, refreshTokenHash } = generateTokens(user._id.toString());
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken,
      user: formatUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Login failed.", error: error.message });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body?.refreshToken || (req.headers["x-refresh-token"] as string);

    if (!refreshToken) {
      res.status(400).json({ success: false, message: "Refresh token is required." });
      return;
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(refreshToken, ENV.REFRESH_SECRET) as { id: string };
    } catch (err: any) {
      res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
      return;
    }

    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      res.status(401).json({ success: false, message: "Session expired or user not found." });
      return;
    }

    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      // Possible token reuse attempt: invalidate token immediately
      user.refreshTokenHash = undefined;
      await user.save();
      res.status(401).json({ success: false, message: "Token reuse detected. Please log in again." });
      return;
    }

    // Token rotation: issue a fresh pair
    const tokens = generateTokens(user._id.toString());
    user.refreshTokenHash = tokens.refreshTokenHash;
    await user.save();

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: formatUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Token refresh failed.", error: error.message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
    }
    res.json({ success: true, message: "Logged out successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Logout failed.", error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    res.json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch user.", error: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    const { name, title, weeklyCapacityHours, skills, avatarColor } = req.body;
    const user = req.user;

    if (name) {
      user.name = name.trim();
      const parts = user.name.split(/\s+/);
      user.initials = parts.map((p) => p[0]).slice(0, 2).join("").toUpperCase() || user.initials;
    }
    if (title) user.title = title;
    if (weeklyCapacityHours !== undefined) user.weeklyCapacityHours = Math.max(1, Number(weeklyCapacityHours));
    if (skills && Array.isArray(skills)) user.skills = skills;
    if (avatarColor) user.avatarColor = avatarColor;

    await user.save();

    res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update profile.", error: error.message });
  }
};

export const updatePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Current and new password are required." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
      return;
    }

    const userWithPassword = await User.findById(req.user._id).select("+password");
    if (!userWithPassword) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const isMatch = await userWithPassword.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Current password does not match." });
      return;
    }

    userWithPassword.password = newPassword;
    // Invalidate refresh tokens on password change
    userWithPassword.refreshTokenHash = undefined;
    await userWithPassword.save();

    res.json({
      success: true,
      message: "Password updated successfully. Please log in again with your new password.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update password.", error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required." });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
      await user.save();

      const origin = req.headers.origin || ENV.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${origin}/forgot-password?token=${resetToken}`;
      console.log(`[Password Reset] Reset token generated for '${cleanEmail}': ${resetUrl}`);
    } else {
      console.warn(`[Security Audit] Password reset requested for non-existent email '${cleanEmail}' from IP '${req.ip || "unknown"}'`);
    }

    // Always return constant message to prevent email enumeration attacks
    res.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been generated.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to process password reset request.", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: "Reset token and new password are required." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
      return;
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires +password");

    if (!user) {
      console.warn(`[Security Audit] Invalid or expired password reset attempt with token from IP '${req.ip || "unknown"}'`);
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token. Please request a new one.",
      });
      return;
    }

    user.password = newPassword;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    // Invalidate existing sessions on password change
    user.refreshTokenHash = undefined;
    await user.save();

    console.log(`[Security Audit] Password successfully reset for user '${user.email}' from IP '${req.ip || "unknown"}'`);

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to reset password.", error: error.message });
  }
};

