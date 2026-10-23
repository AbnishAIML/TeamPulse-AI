import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ENV } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
};

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
      .split(" ")
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const colors = ["blue", "violet", "pink", "green", "orange"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      initials,
      avatarColor,
      title: title || "Software Engineer",
      weeklyCapacityHours: weeklyCapacityHours || 20,
      skills: Array.isArray(skills) ? skills : [],
    });

    const token = generateToken(user._id.toString());
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        avatarColor: user.avatarColor,
        systemRole: user.systemRole,
        title: user.title,
        weeklyCapacityHours: user.weeklyCapacityHours,
        skills: user.skills,
      },
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

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const token = generateToken(user._id.toString());
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        avatarColor: user.avatarColor,
        systemRole: user.systemRole,
        title: user.title,
        weeklyCapacityHours: user.weeklyCapacityHours,
        skills: user.skills,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Login failed.", error: error.message });
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
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        initials: req.user.initials,
        avatarColor: req.user.avatarColor,
        systemRole: req.user.systemRole,
        title: req.user.title,
        weeklyCapacityHours: req.user.weeklyCapacityHours,
        skills: req.user.skills,
      },
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

    if (name) user.name = name;
    if (title) user.title = title;
    if (weeklyCapacityHours !== undefined) user.weeklyCapacityHours = Number(weeklyCapacityHours);
    if (skills && Array.isArray(skills)) user.skills = skills;
    if (avatarColor) user.avatarColor = avatarColor;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        avatarColor: user.avatarColor,
        systemRole: user.systemRole,
        title: user.title,
        weeklyCapacityHours: user.weeklyCapacityHours,
        skills: user.skills,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to update profile.", error: error.message });
  }
};
