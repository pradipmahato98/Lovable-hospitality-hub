import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { env } from "./config/env";
import authRoutes from "./routes/auth";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors({
  origin: "*", // Configurable via env in production
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Routes
app.route("/api/v1/auth", authRoutes);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const port = Number(env.PORT);
console.log(`🚀 Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
