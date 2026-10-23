import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { User, IUser } from "../models/User.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication required. Missing Bearer token." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found or token has expired." });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: "Invalid or expired token.", error: error.message });
  }
};
