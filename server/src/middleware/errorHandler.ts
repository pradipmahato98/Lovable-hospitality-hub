import { Context, Next } from "hono";

/**
 * RFC 7807 Error Handler
 */
export async function errorHandler(err: any, c: Context) {
  const status = err.status || 500;
  const message = err.message || "An unexpected error occurred";

  return c.json({
    type: "https://luxestay.com/errors/internal-server-error",
    title: status === 500 ? "Internal Server Error" : "Error",
    status,
    detail: message,
    instance: c.req.url,
  }, status as any);
}
