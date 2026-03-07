import postgres from "postgres";
import { env } from "@/config/env";
import { Server } from "socket.io";

export async function listenToDatabaseChanges(io: Server) {
  const sql = postgres(env.DATABASE_URL);

  console.log("📡 Starting database change listener...");

  // Note: This requires the 'realtime' publication to be created in PG
  // For this isolated setup, we'll simulate the broadcast on table-level events
  // or use a generic notification channel.

  await sql.listen("realtime_change", (payload) => {
    const data = JSON.parse(payload);
    io.to(data.table).emit("change", data);
  });
}
