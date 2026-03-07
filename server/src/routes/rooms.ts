import { Hono } from "hono";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const roomsApi = new Hono();

const querySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || "1")),
  limit: z.string().optional().transform(v => parseInt(v || "10")),
});

/**
 * List rooms with pagination
 */
roomsApi.get("/", zValidator("query", querySchema), async (c) => {
  const { page, limit } = c.req.valid("query");
  const offset = (page - 1) * limit;

  const data = await db.query.rooms.findMany({
    limit,
    offset,
    orderBy: [desc(rooms.createdAt)],
  });

  return c.json({ data, page, limit });
});

export default roomsApi;
