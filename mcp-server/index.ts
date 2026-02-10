import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Fallback for dev
const PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const server = new Server(
  {
    name: "luxestay-erp-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Definitions
 */
const TOOLS = [
  {
    name: "get_room_availability",
    description: "Check available rooms for specific dates",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date string" },
        endDate: { type: "string", description: "ISO date string" },
        roomType: { type: "string", description: "Optional room type filter" },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "create_reservation",
    description: "Create a new room reservation",
    inputSchema: {
      type: "object",
      properties: {
        guestId: { type: "string" },
        roomId: { type: "string" },
        checkInDate: { type: "string" },
        checkOutDate: { type: "string" },
        adults: { type: "number", default: 1 },
        children: { type: "number", default: 0 },
        specialRequests: { type: "string" },
      },
      required: ["guestId", "roomId", "checkInDate", "checkOutDate"],
    },
  },
  {
    name: "list_reservations",
    description: "List recent or filtered reservations",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["confirmed", "checked_in", "checked_out", "cancelled"] },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "get_inventory_status",
    description: "Check stock levels for inventory items",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        lowStockOnly: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "list_housekeeping_tasks",
    description: "List current housekeeping tasks",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "in_progress", "completed"] },
        assignedTo: { type: "string" },
      },
    },
  },
  {
    name: "supabase_query",
    description: "Run a read-only SQL query against the database (SELECT only)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The SQL SELECT query" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_schema_info",
    description: "Get information about the database schema (tables and columns)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ping",
    description: "Ping the MCP server to check connectivity",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "manage_guest_profile",
    description: "Create or update a guest profile",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Guest ID for updates" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        isVip: { type: "boolean" },
      },
      required: ["firstName", "lastName"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_room_availability": {
        const { startDate, endDate, roomType } = z.object({
          startDate: z.string(),
          endDate: z.string(),
          roomType: z.string().optional(),
        }).parse(args);

        let query = supabase
          .from("rooms")
          .select("*")
          .eq("status", "available");

        if (roomType) {
          query = query.eq("room_type", roomType);
        }

        const { data: rooms, error } = await query;
        if (error) throw error;

        // In a real implementation, we'd cross-reference with reservations table
        // For this demo, we return available rooms from the rooms table
        return {
          content: [{ type: "text", text: JSON.stringify(rooms, null, 2) }],
        };
      }

      case "create_reservation": {
        const data = z.object({
          guestId: z.string(),
          roomId: z.string(),
          checkInDate: z.string(),
          checkOutDate: z.string(),
          adults: z.number().default(1),
          children: z.number().default(0),
          specialRequests: z.string().optional(),
        }).parse(args);

        const reservationCode = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const { data: reservation, error } = await supabase
          .from("reservations")
          .insert([{
            guest_id: data.guestId,
            room_id: data.roomId,
            check_in_date: data.checkInDate,
            check_out_date: data.checkOutDate,
            adults: data.adults,
            children: data.children,
            special_requests: data.specialRequests,
            status: "confirmed",
            reservation_code: reservationCode,
            total_amount: 0, // Should be calculated
          }])
          .select()
          .single();

        if (error) throw error;

        return {
          content: [{ type: "text", text: `Reservation created successfully: ${reservation.reservation_code}` }],
        };
      }

      case "list_reservations": {
        const { status, limit } = z.object({
          status: z.string().optional(),
          limit: z.number().default(10),
        }).parse(args);

        let query = supabase
          .from("reservations")
          .select("*, rooms(room_number), guests(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: reservations, error } = await query;
        if (error) throw error;

        return {
          content: [{ type: "text", text: JSON.stringify(reservations, null, 2) }],
        };
      }

      case "get_inventory_status": {
        const { categoryId, lowStockOnly } = z.object({
          categoryId: z.string().optional(),
          lowStockOnly: z.boolean().default(false),
        }).parse(args);

        let query = supabase.from("inventory_items").select("*");

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }

        const { data: items, error } = await query;
        if (error) throw error;

        const filtered = lowStockOnly
          ? items.filter(item => item.current_stock <= item.reorder_point)
          : items;

        return {
          content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
        };
      }

      case "list_housekeeping_tasks": {
        const { status, assignedTo } = z.object({
          status: z.string().optional(),
          assignedTo: z.string().optional(),
        }).parse(args);

        let query = supabase.from("housekeeping_tasks").select("*, rooms(room_number)");

        if (status) query = query.eq("status", status);
        if (assignedTo) query = query.eq("assigned_to", assignedTo);

        const { data: tasks, error } = await query;
        if (error) throw error;

        return {
          content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
        };
      }

      case "supabase_query": {
        const { query } = z.object({
          query: z.string(),
        }).parse(args);

        if (!query.toLowerCase().trim().startsWith("select")) {
          throw new McpError(ErrorCode.InvalidParams, "Only SELECT queries are allowed via this tool");
        }

        const { data, error } = await supabase.rpc("execute_sql", { sql_query: query });

        if (error) {
          return {
            isError: true,
            content: [{ type: "text", text: `SQL execution error: ${error.message}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "get_schema_info": {
        const { data, error } = await supabase.rpc("get_schema_info");

        if (error) throw error;

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "ping": {
        return {
          content: [{ type: "text", text: "pong" }],
        };
      }

      case "manage_guest_profile": {
        const data = z.object({
          id: z.string().optional(),
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          isVip: z.boolean().optional(),
        }).parse(args);

        let result;
        if (data.id) {
          const { data: guest, error } = await supabase
            .from("guests")
            .update({
              first_name: data.firstName,
              last_name: data.lastName,
              email: data.email,
              phone: data.phone,
              is_vip: data.isVip,
            })
            .eq("id", data.id)
            .select()
            .single();
          if (error) throw error;
          result = guest;
        } else {
          const { data: guest, error } = await supabase
            .from("guests")
            .insert([{
              first_name: data.firstName,
              last_name: data.lastName,
              email: data.email,
              phone: data.phone,
              is_vip: data.isVip,
            }])
            .select()
            .single();
          if (error) throw error;
          result = guest;
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => e.message).join(", ")}`);
    }
    throw error;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LuxeStay ERP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
