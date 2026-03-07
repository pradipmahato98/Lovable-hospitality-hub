import { Hono } from "hono";
import { getPresignedUrl } from "@/services/storage";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const storage = new Hono();

const bucketSchema = z.enum(["avatars", "documents", "media", "private", "temp"]);

storage.get("/signed-url/:bucket/:key", zValidator("param", z.object({
  bucket: bucketSchema,
  key: z.string(),
})), async (c) => {
  const { bucket, key } = c.req.valid("param");
  const url = await getPresignedUrl(bucket, key);
  return c.json({ url });
});

export default storage;
