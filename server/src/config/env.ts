import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const getPem = (filename: string) => {
  const filePath = path.resolve("keys", filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().default(() => getPem("private.pem")),
  JWT_PUBLIC_KEY: z.string().default(() => getPem("public.pem")),
  CORS_ORIGIN: z.string().default("*"),
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(64), // Hex encoded 32-byte key
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
