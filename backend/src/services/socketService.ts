import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer, clientUrl: string): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    // Join project room
    socket.on("join:project", (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    // Leave project room
    socket.on("leave:project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join user personal notification channel
    socket.on("join:user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};

export const emitToProject = (projectId: string, event: string, data: any): void => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
