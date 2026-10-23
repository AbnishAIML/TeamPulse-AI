import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;
let currentStatus = "offline"; // "connected" | "reconnecting" | "offline"
const listeners = new Set();

const notifyStatus = (status) => {
  currentStatus = status;
  listeners.forEach((fn) => {
    try {
      fn(status);
    } catch (e) {
      console.error("[Socket] Listener error:", e);
    }
  });
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected with ID:", socket.id);
      notifyStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      notifyStatus(reason === "io server disconnect" ? "offline" : "reconnecting");
    });

    socket.on("connect_error", (error) => {
      console.warn("[Socket] Connect error:", error.message);
      notifyStatus("offline");
    });

    socket.io.on("reconnect_attempt", () => {
      notifyStatus("reconnecting");
    });

    socket.io.on("reconnect", () => {
      notifyStatus("connected");
    });
  }
  return socket;
};

export const getConnectionState = () => currentStatus;

export const subscribeConnectionState = (callback) => {
  listeners.add(callback);
  callback(currentStatus);
  return () => {
    listeners.delete(callback);
  };
};

export const joinProjectRoom = (projectId) => {
  const s = getSocket();
  if (s && projectId) {
    s.emit("join:project", projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  const s = getSocket();
  if (s && projectId) {
    s.emit("leave:project", projectId);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit("join:user", userId);
  }
};
