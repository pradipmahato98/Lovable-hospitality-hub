import { Hono } from "hono";
import { env } from "@/config/env";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const storage = new Hono();

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `http://${env.STORAGE_ENDPOINT}:9000`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY,
    secretAccessKey: env.STORAGE_SECRET_KEY,
  },
});

/**
 * Handle multipart/form-data uploads and stream to S3/MinIO
 */
storage.post("/upload", async (c) => {
  const bucket = c.req.query("bucket") || "avatars";
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const path = body["path"] as string;

  if (!file) return c.json({ error: "No file provided" }, 400);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: buffer,
      ContentType: file.type,
    }));

    return c.json({
      message: "File uploaded successfully",
      path,
      bucket
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

storage.get("/url/:bucket/:key", async (c) => {
  const { bucket, key } = c.req.param();
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return c.json({ url });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default storage;
