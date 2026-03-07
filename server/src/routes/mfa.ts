import { Hono } from "hono";
import * as otplib from "otplib";

const mfa = new Hono();

mfa.post("/setup", async (c) => {
  const secret = otplib.generateSecret();
  return c.json({ secret });
});

mfa.post("/verify", async (c) => {
  const body = await c.req.json() as { token: string; secret: string };
  const isValid = await otplib.verify({ token: body.token, secret: body.secret });
  return c.json({ valid: isValid.valid });
});

export default mfa;
