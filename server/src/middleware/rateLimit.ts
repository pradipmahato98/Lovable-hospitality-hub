import { Hono } from "hono";
import { env } from "@/config/env";

/**
 * Basic In-Memory Rate Limiter (For Production, use Redis)
 */
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export const rateLimiter = (limit: number, windowMs: number) => {
  return async (c: any, next: any) => {
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return c.json({ error: "Too many requests" }, 429);
    }

    entry.count++;
    return next();
  };
};
