import { Hono } from "hono";
import { db } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Creates a standard CRUD router for a given Drizzle table
 */
export function createCRUDRouter(table: any, tableName: string) {
  const router = new Hono();

  router.get("/", async (c) => {
    const data = await db.select().from(table);
    return c.json(data);
  });

  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [item] = await db.select().from(table).where(eq(table.id, id));
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  });

  router.post("/", async (c) => {
    const body = await c.req.json();
    const [newItem] = await db.insert(table).values(body).returning();
    return c.json(newItem, 201);
  });

  return router;
}
