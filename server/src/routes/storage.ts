import { Hono } from "hono";
import { env } from "@/config/env";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const storage = new Hono();

storage.get("/presigned-url/:bucket/:key", async (c) => {
  const { bucket, key } = c.req.param();

  // Real implementation would use S3/MinIO SDK here to generate a signed URL
  const expires = 3600; // 1 hour
  const signedUrl = `http://${env.STORAGE_ENDPOINT}:9000/${bucket}/${key}?X-Amz-Expires=${expires}&...`;

  return c.json({ url: signedUrl, expires });
});

export default storage;
