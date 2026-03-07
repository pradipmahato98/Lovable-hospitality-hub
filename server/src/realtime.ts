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

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`📡 New connection: ${socket.id}`);

    socket.on("subscribe", (room) => {
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  return io;
}
