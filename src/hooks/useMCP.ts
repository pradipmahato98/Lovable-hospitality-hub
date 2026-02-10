import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMCP = () => {
  const [isLoading, setIsLoading] = useState(false);

  const executeTool = useCallback(async (name: string, args: any) => {
    setIsLoading(true);
    try {
      let result;
      switch (name) {
        case "get_room_availability": {
          const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .eq("status", "available");
          if (error) throw error;
          result = data;
          break;
        }
        case "ping": {
          result = { message: "pong" };
          break;
        }
        case "list_reservations": {
          const { data, error } = await supabase
            .from("reservations")
            .select("*, rooms(room_number), guests(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(args.limit || 10);
          if (error) throw error;
          result = data;
          break;
        }
        case "supabase_query": {
          const { data, error } = await supabase.rpc("execute_sql", { sql_query: args.query });
          if (error) throw error;
          result = data;
          break;
        }
        case "get_schema_info": {
          const { data, error } = await supabase.rpc("get_schema_info");
          if (error) throw error;
          result = data;
          break;
        }
        default:
          // For tools not implemented here, we could potentially call an Edge Function
          // that hosts the MCP server, but for now we just handle the core ones.
          throw new Error(`Tool ${name} not supported in frontend terminal yet.`);
      }
      return result;
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      toast.error(`Execution failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeTool,
    isLoading,
  };
};
