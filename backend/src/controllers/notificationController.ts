import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { unreadOnly } = req.query;

    const query: any = { recipientId: userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("projectId", "name code")
      .populate("taskId", "title priority status")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications.", error: error.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: req.user!._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found." });
      return;
    }

    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to mark notification as read.", error: error.message });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ recipientId: req.user!._id, isRead: false }, { isRead: true });

    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to mark all as read.", error: error.message });
  }
};
