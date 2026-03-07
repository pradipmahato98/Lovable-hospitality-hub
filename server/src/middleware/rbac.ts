import { Hono } from "hono";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const rbac = (requiredRole: string) => {
  return async (c: any, next: any) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const roles = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, user.sub),
    });

    const hasRole = roles.some(r => r.role === requiredRole || r.role === "admin");
    if (!hasRole) return c.json({ error: "Forbidden" }, 403);

    return next();
  };
};
