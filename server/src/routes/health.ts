import { Hono } from "hono";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const health = new Hono();

health.get("/", async (c) => {
  const dbHealth = await checkDbHealth();

  return c.json({
    status: dbHealth ? "ok" : "degraded",
    checks: {
      db: { status: dbHealth ? "ok" : "down" },
      storage: { status: "ok" }, // Placeholder for actual S3 ping
      cache: { status: "ok" },   // Placeholder for actual Redis ping
    }
  });
});

async function checkDbHealth() {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export default health;
