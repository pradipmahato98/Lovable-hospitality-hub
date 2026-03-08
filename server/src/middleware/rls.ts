import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Middleware to enforce RLS by setting the current user ID in the PG session
 */
export async function rlsMiddleware(c: Context, next: Next) {
  const token = c.req.header("Authorization")?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ["RS256"] }) as { sub: string };
      c.set("userId", decoded.sub);

      // 🛡️ Sentinel: Enforce RLS at the DB session level
      await db.execute(sql`SET app.current_user_id = ${decoded.sub}`);
    } catch (err) {
      console.warn("🛡️ Sentinel: Invalid token in RLS middleware");
    }
  }

  await next();
}
