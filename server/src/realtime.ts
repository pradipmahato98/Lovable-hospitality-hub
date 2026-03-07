import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "@/config/env";
import jwt from "jsonwebtoken";

export function setupRealtime(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track online users
  const presenceMap = new Map<string, string>(); // userId -> socketId

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ["RS256"] }) as { sub: string };
      (socket as any).userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    presenceMap.set(userId, socket.id);

    // Broadcast presence
    io.emit("presence:online", { userId });

    socket.on("subscribe", (room) => {
      socket.join(room);
    });

    socket.on("typing", (data) => {
      socket.to(data.room).emit("user:typing", { userId, ...data });
    });

    socket.on("disconnect", () => {
      presenceMap.delete(userId);
      io.emit("presence:offline", { userId });
    });
  });

  return io;
}
