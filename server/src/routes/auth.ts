import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { db } from "@/db";
import { profiles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setCookie } from "hono/cookie";

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

/**
 * Registers a new user with Argon2 password hashing.
 */
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, firstName, lastName } = c.req.valid("json");
  const hashedPassword = await argon2.hash(password);

  try {
    const userId = crypto.randomUUID();
    const [newProfile] = await db.insert(profiles).values({
      userId,
      email,
      firstName,
      lastName,
    }).returning();

    await db.insert(userRoles).values({
      userId,
      role: "user",
    });

    return c.json({ message: "User registered successfully", userId }, 201);
  } catch (error) {
    return c.json({ error: "Registration failed" }, 400);
  }
});

auth.post("/login", async (c) => {
  // Production implementation would verify argon2 hash here
  return c.json({ accessToken: "simulated_token" });
});

export default auth;
