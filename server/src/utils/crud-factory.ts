import { Hono } from "hono";
import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";

/**
 * Creates a standard CRUD router for a given Drizzle table.
 * Supports GET (list with filtering), GET (single), POST (create), PATCH (update), and DELETE.
 */
export function createCRUDRouter(table: any, tableName: string) {
  const router = new Hono();

  // List items with basic filtering support
  router.get("/", async (c) => {
    const filtersRaw = c.req.query("filters");
    let query = db.select().from(table);

    if (filtersRaw) {
      try {
        const filters = JSON.parse(filtersRaw);
        // Apply filters (basic support for eq and in)
        for (const f of filters) {
          if (f.type === 'eq') {
            query = query.where(eq(table[f.column] || table.userId, f.value)) as any;
          } else if (f.type === 'in' && Array.isArray(f.value) && f.value.length > 0) {
            query = query.where(inArray(table[f.column], f.value)) as any;
          }
        }
      } catch (e) {
        console.error("Failed to parse filters in CRUD router", e);
      }
    }

    const data = await query;
    return c.json(data);
  });

  // Get single item by ID
  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [item] = await db.select().from(table).where(eq(table.id || table.userId, id));
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  });

  // Create new item
  router.post("/", async (c) => {
    const body = await c.req.json();
    const [newItem] = await db.insert(table).values(body).returning();
    return c.json(newItem, 201);
  });

  // Update item
  router.patch("/", async (c) => {
    const { updates, filters } = await c.req.json();
    const id = filters?.find((f: any) => f.column === 'id' || f.column === 'user_id' || f.column === 'userId')?.value;

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
    const id = filters?.find((f: any) => f.column === 'id' || f.column === 'user_id' || f.column === 'userId')?.value;

    if (!id) return c.json({ error: "Missing ID for deletion" }, 400);

    await db.delete(table).where(eq(table.id || table.userId, id));
    return c.json({ success: true });
  });

  return router;
}
