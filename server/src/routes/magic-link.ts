import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { sendEmail, emailTemplates } from "@/services/email";

const magicLink = new Hono();

const magicLinkSchema = z.object({
  email: z.string().email(),
});

magicLink.post("/send", zValidator("json", magicLinkSchema), async (c) => {
  const { email } = c.req.valid("json");

  const token = jwt.sign({ email }, env.JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "1h"
  });

  const loginUrl = `${c.req.url.split("/api")[0]}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Login to LuxeStay",
    html: emailTemplates.passwordReset(loginUrl), // Reusing logic for demo
  });

  return c.json({ message: "Magic link sent" });
});

export default magicLink;
