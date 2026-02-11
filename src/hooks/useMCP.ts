import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMCPConfig } from "./useSettings";
import { Client } from "@modelcontextprotocol/sdk/client/index";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import { createClient } from "@supabase/supabase-js";

export const useMCP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: mcpConfig } = useMCPConfig();
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const transportRef = useRef<SSEClientTransport | null>(null);

  // Initialize Remote MCP Client if in remote mode
  useEffect(() => {
    let mounted = true;

    if (mcpConfig?.connection_mode === 'remote' && mcpConfig.server_url) {
      const initClient = async () => {
        try {
          // Validate URL before attempting connection
          let url;
          try {
            url = new URL(mcpConfig.server_url);
          } catch (e) {
            if (mounted) toast.error("Invalid MCP Server URL");
            return;
          }

          const transport = new SSEClientTransport(url);
          const client = new Client(
            { name: "luxestay-erp-client", version: "1.0.0" },
            { capabilities: {} }
          );

          await client.connect(transport);

          if (mounted) {
            transportRef.current = transport;
            setMcpClient(client);
            setIsConnected(true);
            toast.success("Connected to remote MCP server");
          }
        } catch (error) {
          console.error("Failed to connect to remote MCP server:", error);
          if (mounted) {
            toast.error("MCP Connection failed. Falling back to local mode.");
            setIsConnected(false);
          }
        }
      };

      initClient();
    } else {
      setMcpClient(null);
      setIsConnected(false);
    }

    return () => {
      mounted = false;
      if (transportRef.current) {
        // SSE transport cleanup if necessary
      }
    };
  }, [mcpConfig?.connection_mode, mcpConfig?.server_url]);

  const executeTool = useCallback(async (name: string, args: any) => {
    setIsLoading(true);
    try {
      // 1. If in remote mode and connected, use the MCP client
      if (mcpConfig?.connection_mode === 'remote' && mcpClient) {
        const response = await mcpClient.callTool({
          name,
          arguments: args
        });
        return response;
      }

      // 2. Otherwise use local Supabase direct mode
      // If a service role key is provided, use a custom client
      const client = mcpConfig?.service_role_key
        ? createClient(import.meta.env.VITE_SUPABASE_URL, mcpConfig.service_role_key)
        : supabase;

      let result;
      switch (name) {
        case "get_room_availability": {
          const { data, error } = await client
            .from("rooms")
            .select("*")
            .eq("status", "available");
          if (error) throw error;
          result = data;
          break;
        }
        case "ping": {
          result = { message: "pong", mode: mcpConfig?.connection_mode || 'local' };
          break;
        }
        case "list_reservations": {
          const { data, error } = await client
            .from("reservations")
            .select("*, rooms(room_number), guests(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(args.limit || 10);
          if (error) throw error;
          result = data;
          break;
        }
        case "supabase_query": {
          const { data, error } = await client.rpc("execute_sql", { sql_query: args.query });
          if (error) throw error;
          result = data;
          break;
        }
        case "get_schema_info": {
          const { data, error } = await client.rpc("get_schema_info");
          if (error) throw error;
          result = data;
          break;
        }
        default:
          throw new Error(`Tool ${name} not supported in local mode. Connect to a remote MCP server for more tools.`);
      }
      return result;
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      toast.error(`Execution failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mcpConfig, mcpClient]);

  return {
    executeTool,
    isLoading,
    isConnected,
    connectionMode: mcpConfig?.connection_mode || 'local'
  };
};
