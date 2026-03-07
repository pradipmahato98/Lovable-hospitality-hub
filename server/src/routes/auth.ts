import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { db } from "@/db";
import { profiles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, firstName, lastName } = c.req.valid("json");

  const hashedPassword = await argon2.hash(password);

  // In a real system, we'd have an 'users' table in an 'auth' schema.
  // For this isolated demo, we'll store everything in profiles for simplicity,
  // but ideally 'users' handles credentials and 'profiles' handles metadata.

  try {
    const [newProfile] = await db.insert(profiles).values({
      userId: crypto.randomUUID(), // Simulated userId
      email,
      firstName,
      lastName,
    }).returning();

    // Assign default role
    await db.insert(userRoles).values({
      userId: newProfile.userId,
      role: "user",
    });

    return c.json({ message: "User registered successfully", userId: newProfile.userId }, 201);
  } catch (error) {
    return c.json({ error: "Registration failed" }, 400);
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  });

  if (!profile) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Verification logic would go here

  const token = jwt.sign(
    { sub: profile.userId, email: profile.email },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return c.json({ accessToken: token });
});

export default auth;
