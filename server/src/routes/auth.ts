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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Registers a new user with Argon2 password hashing.
 */
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, firstName, lastName } = c.req.valid("json");
  const hashedPassword = await argon2.hash(password);

  try {
    const userId = crypto.randomUUID();
    await db.insert(profiles).values({
      userId,
      email,
      firstName,
      lastName,
      passwordHash: hashedPassword,
    });

    await db.insert(userRoles).values({
      userId,
      role: "user",
    });

    return c.json({ message: "User registered successfully", userId }, 201);
  } catch (error) {
    return c.json({ error: "Registration failed" }, 400);
  }
});

/**
 * Authenticates user and issues RS256 signed JWTs.
 */
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  });

  if (!profile || !profile.passwordHash) return c.json({ error: "Invalid credentials" }, 401);

  const isValid = await argon2.verify(profile.passwordHash, password);
  if (!isValid) return c.json({ error: "Invalid credentials" }, 401);

  const accessToken = jwt.sign(
    { sub: profile.userId, email: profile.email, role: "user" },
    env.JWT_PRIVATE_KEY,
    { algorithm: "RS256", expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: profile.userId },
    env.JWT_PRIVATE_KEY,
    { algorithm: "RS256", expiresIn: "7d" }
  );

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.json({
    accessToken,
    user: { id: profile.userId, email: profile.email }
  });
});

export default auth;
