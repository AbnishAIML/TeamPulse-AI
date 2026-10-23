import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected with ID:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });
  }
  return socket;
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
