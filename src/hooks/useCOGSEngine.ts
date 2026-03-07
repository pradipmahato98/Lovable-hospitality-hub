import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCOGSConfigs } from "./useFinanceAdvanced";
import { useCreateJournalEntry } from "./useFinance";

export function useCOGSEngine() {
  const { data: configs } = useCOGSConfigs();
  const createJournalEntry = useCreateJournalEntry();

  useEffect(() => {
    // Listen for stock movements of type 'out'
    const channel = supabase
      .channel("cogs-automation")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stock_movements" },
        async (payload) => {
          const movement = payload.new;
          if (movement.movement_type !== "out") return;

          // Find config for this item's category
          // 1. Get item category
          const { data: item } = await supabase
            .from("inventory_items")
            .select("category_id, cost_price, name")
            .eq("id", movement.item_id)
            .single();

          if (!item) return;

          const config = configs?.find(c => c.inventory_category_id === item.category_id && c.auto_post);
          if (!config) return;

          const totalCost = movement.quantity * item.cost_price;
          if (totalCost <= 0) return;

          // 2. Auto-post Journal Entry
          try {
            await createJournalEntry.mutateAsync({
              date: new Date().toISOString().split("T")[0],
              description: `Automated COGS: ${item.name} consumption (${movement.quantity} units)`,
              voucher_type: 'JV',
              lines: [
                {
                    account_id: config.cogs_expense_account_id,
                    debit: totalCost,
                    credit: 0,
                    description: `COGS for ${item.name}`
                },
                {
                    account_id: config.inventory_asset_account_id,
                    debit: 0,
                    credit: totalCost,
                    description: `Inventory reduction for ${item.name}`
                }
              ]
            });
            console.log(`Auto-posted COGS for ${item.name}: $${totalCost}`);
          } catch (err) {
            console.error("Failed to auto-post COGS:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [configs, createJournalEntry]);
}
