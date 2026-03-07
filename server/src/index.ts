import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import * as Sentry from "@sentry/node";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import healthRoutes from "./routes/health";
import storageRoutes from "./routes/storage";
import roomsRoutes from "./routes/rooms";
import { rateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use("*", compress());
app.use("*", secureHeaders());
app.use("*", rateLimiter(100, 15 * 60 * 1000));
app.use("*", cors({
  origin: env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Routes
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/storage", storageRoutes);
app.route("/api/v1/health", healthRoutes);
app.route("/api/v1/rooms", roomsRoutes);

// Error Handling
app.onError(errorHandler);

const port = Number(env.PORT);
serve({ fetch: app.fetch, port });
