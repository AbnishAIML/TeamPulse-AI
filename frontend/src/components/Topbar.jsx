import React, { useState, useEffect } from "react";
import { Menu, Search, Bell, AlertTriangle, Clock3, CheckCircle2, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useProject } from "../context/ProjectContext.jsx";
import { notificationsAPI } from "../services/api.js";
import { getSocket, subscribeConnectionState } from "../services/socket.js";

export default function Topbar({ activeNav, search, setSearch, setMobileNav }) {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("offline");

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribeConn = subscribeConnectionState(setConnectionStatus);

    // Listen for real-time notifications
    const s = getSocket();
    let handleNewNotification = null;
    if (s) {
      handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      };
      s.on("notification:new", handleNewNotification);
    }

    return () => {
      unsubscribeConn();
      if (s && handleNewNotification) {
        s.off("notification:new", handleNewNotification);
      }
    };
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <header className="topbar">
      <button
        className="icon-button mobile-menu"
        onClick={() => setMobileNav(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="breadcrumbs">
        <span>{activeProject?.name || "Workspace"}</span>
        <span className="crumb-slash">/</span>
        <strong>{activeNav}</strong>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, tags, or assignees..."
          />
          <kbd>⌘ K</kbd>
        </label>

        {/* Real-Time Connection Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: connectionStatus === "connected" ? "#122822" : connectionStatus === "reconnecting" ? "#2b2212" : "#24181c",
            border: `1px solid ${connectionStatus === "connected" ? "#1e4d3d" : connectionStatus === "reconnecting" ? "#593d18" : "#4a2428"}`,
            fontSize: "10px",
            fontWeight: 600,
            color: connectionStatus === "connected" ? "#72dcb5" : connectionStatus === "reconnecting" ? "#f59e0b" : "#ff8c9c",
            userSelect: "none",
          }}
          title={connectionStatus === "connected" ? "Real-time live sync connected via Socket.IO" : connectionStatus === "reconnecting" ? "Attempting to reconnect live sync..." : "Live sync offline"}
          aria-live="polite"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connectionStatus === "connected" ? "#10b981" : connectionStatus === "reconnecting" ? "#f59e0b" : "#ef4444",
              boxShadow: connectionStatus === "connected" ? "0 0 6px #10b981" : "none",
            }}
          />
          <span>{connectionStatus === "connected" ? "Live" : connectionStatus === "reconnecting" ? "Reconnecting" : "Offline"}</span>
        </div>

        <button
          className="icon-button notification-button"
          onClick={() => setShowNotifications((v) => !v)}
          aria-label="Notifications"
          title="Notification Center"
        >
          <Bell size={18} />
          {unreadCount > 0 && <i></i>}
        </button>

        <span className={`avatar avatar-${user?.avatarColor || "blue"}`} title={user?.name || "User Profile"}>
          {user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : "U")}
        </span>
      </div>

      {showNotifications && (
        <div className="notification-popover" style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              borderBottom: "1px solid #283149",
              paddingBottom: "8px",
            }}
          >
            <strong>Notifications {unreadCount > 0 && `(${unreadCount})`}</strong>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#9b8cff",
                  fontSize: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ color: "#808ba5", fontSize: "11px", textAlign: "center", padding: "16px 0" }}>
              No notifications right now.
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div
                key={n._id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #20283b",
                  opacity: n.isRead ? 0.7 : 1,
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: n.type.includes("BLOCKER") ? "#ff8c9c" : "#ffbd7c", marginTop: "2px" }}>
                  {n.type.includes("BLOCKER") ? <AlertTriangle size={14} /> : <Clock3 size={14} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#dce1f0" }}>{n.title}</div>
                  <div style={{ fontSize: "10px", color: "#8d98b2", marginTop: "2px", lineHeight: "1.4" }}>
                    {n.message}
                  </div>
                </div>
              </div>
            ))
          )}

          <button
            style={{ marginTop: "12px", width: "100%" }}
            onClick={() => setShowNotifications(false)}
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
}
