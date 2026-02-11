# Agent Instructions for LuxeStay ERP

This project is configured with a full Supabase integration, including Database, Auth, Storage, and Realtime.

## Supabase MCP Setup

The project includes a custom MCP server with LuxeStay-specific domain tools.

### Connecting to Claude Desktop

1. Open your Claude Desktop configuration (usually `~/Library/Application Support/Claude/claude_desktop_config.json`).
2. Add the LuxeStay MCP server:
   ```json
   {
     "mcpServers": {
       "luxestay-erp": {
         "command": "npm",
         "args": ["run", "mcp:start"],
         "cwd": "/path/to/luxestay-erp",
         "env": {
           "VITE_SUPABASE_URL": "your_supabase_url",
           "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
           "VITE_SUPABASE_PROJECT_ID": "rhajtijfptfnezeetcvx"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop.

### Available Custom Tools

- `get_room_availability`: Check room availability by dates and type.
- `create_reservation`: Book rooms directly.
- `list_reservations`: View recent bookings.
- `get_inventory_status`: Check stock levels and low stock alerts.
- `list_housekeeping_tasks`: Monitor cleaning and maintenance status.
- `manage_guest_profile`: Create or update guest information.
- `supabase_query`: Run read-only SQL queries (requires `execute_sql` RPC).
- `get_schema_info`: Inspect the database structure.

### Built-in MCP Terminal

Admin users can access the **MCP Terminal** in the **Developer Panel** (`/dev`) to test these tools directly from the ERP UI.

## Realtime Synchronization

Realtime is enabled for **ALL** tables in the `public` schema.
- The `supabase_realtime` publication has been updated to include all tables.
- Core hooks in `src/hooks/` (e.g., `useOTAChannels`, `useInventoryItems`, `useStaffSchedules`) include `useEffect` listeners that automatically invalidate TanStack Query caches on changes.

## Storage Buckets

The following storage buckets are configured:
- `avatars`: Publicly readable, owner-writable.
- `property-images`: Publicly readable, staff-writable.
- `lost-found-images`: Publicly readable, staff-writable.

## Authentication

- Standard Supabase Auth is used.
- Google OAuth is configured to use the direct Supabase implementation (not the lovable proxy).
- `AuthContext` includes an `uploadAvatar` helper.

## Channel Manager

The Channel Manager (`src/pages/ChannelManager.tsx`) is connected to the backend and supports realtime updates.
