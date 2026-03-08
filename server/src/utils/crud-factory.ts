import { Hono } from "hono";
import { db } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Creates a standard CRUD router for a given Drizzle table.
 * Supports GET (list), GET (single), POST (create), PATCH (update), and DELETE.
 */
export function createCRUDRouter(table: any, tableName: string) {
  const router = new Hono();

  // List all items
  router.get("/", async (c) => {
    const data = await db.select().from(table);
    return c.json(data);
  });

  // Get single item by ID
  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [item] = await db.select().from(table).where(eq(table.id, id));
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  });

  // Create new item
  router.post("/", async (c) => {
    const body = await c.req.json();
    const [newItem] = await db.insert(table).values(body).returning();
    return c.json(newItem, 201);
  });

  // Update item (Simulated filter handling for bridge parity)
  router.patch("/", async (c) => {
    const { updates, filters } = await c.req.json();
    // In a real generic implementation, we'd iterate filters
    // For now, we assume standard 'id' based updates if filters present
    const id = filters?.find((f: any) => f.column === 'id' || f.column === 'user_id')?.value;

    if (!id) return c.json({ error: "Missing ID for update" }, 400);

    const [updatedItem] = await db.update(table)
      .set(updates)
      .where(eq(table.id || table.userId, id))
      .returning();

    return c.json(updatedItem);
  });

  // Delete item
  router.delete("/", async (c) => {
    const { filters } = await c.req.json();
    const id = filters?.find((f: any) => f.column === 'id' || f.column === 'user_id')?.value;

    if (!id) return c.json({ error: "Missing ID for deletion" }, 400);

    await db.delete(table).where(eq(table.id || table.userId, id));
    return c.json({ success: true });
  });

  return router;
}
