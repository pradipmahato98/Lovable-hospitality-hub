import Redis from "ioredis";
import { env } from "@/config/env";

export const redis = new Redis(env.REDIS_URL);

/**
 * Blacklist a token for a specific duration
 */
export async function blacklistToken(token: string, expirySeconds: number) {
  await redis.set(`blacklist:${token}`, "1", "EX", expirySeconds);
}

/**
 * Check if a token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${token}`);
  return result === "1";
}
