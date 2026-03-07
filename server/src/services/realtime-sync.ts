import postgres from "postgres";
import { env } from "@/config/env";
import { Server } from "socket.io";

/**
 * Listens to database changes using PostgreSQL logical replication / NOTIFY
 * and broadcasts them to the relevant Socket.io rooms.
 */
export async function setupRealtimeSync(io: Server) {
  const sql = postgres(env.DATABASE_URL);

  console.log("📡 Real-time sync initialized...");

  // Example of listening to a custom 'events' channel
  await sql.listen("db_changes", (payload) => {
    try {
      const { table, action, data } = JSON.parse(payload);
      io.to(table).emit(`${table}:${action}`, data);
      console.log(`📢 Broadcasted ${action} on ${table}`);
    } catch (error) {
      console.error("❌ Failed to parse DB change payload:", error);
    }
  });
}
