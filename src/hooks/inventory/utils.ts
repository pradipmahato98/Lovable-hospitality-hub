import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export const db = supabase as unknown as SupabaseClient<Database>;

export async function convertUoM(fromId: string, toId: string, quantity: number) {
  if (!fromId || !toId || fromId === toId) return quantity;

  const { data } = await db.from("inventory_uom_conversions")
    .select("conversion_factor")
    .eq("from_uom_id", fromId)
    .eq("to_uom_id", toId)
    .maybeSingle();

  if (data) return quantity * data.conversion_factor;

  const { data: revData } = await db.from("inventory_uom_conversions")
    .select("conversion_factor")
    .eq("from_uom_id", toId)
    .eq("to_uom_id", fromId)
    .maybeSingle();

  if (revData) return quantity / revData.conversion_factor;

  return quantity;
}

export async function createFinanceEntry(description: string, lines: { account_id: string, debit: number, credit: number }[]) {
  const entryNo = `INV-JE-${Date.now()}`;
  const { data: je, error: jeErr } = await db.from('journal_entries').insert({
    entry_number: entryNo,
    date: new Date().toISOString().split('T')[0],
    description,
    is_posted: true
  }).select().single();

  if (je && !jeErr) {
    await db.from('journal_lines').insert(lines.map(l => ({ ...l, journal_entry_id: je.id })));
  }
}

export async function getInventoryAccount(key: string) {
  const { data } = await db.from('inventory_settings').select('setting_value').eq('setting_key', key).single();
  return data?.setting_value || 'f2345678-1234-5678-1234-567812345678';
}

export async function updateStoreStock(itemId: string, storeId: string, quantity: number, mode: 'increment' | 'decrement' | 'set') {
   const { data: existing } = await db.from('inventory_item_stores').select('current_stock').eq('item_id', itemId).eq('store_id', storeId).maybeSingle();

   let newStock = quantity;
   if (mode === 'increment') newStock = (existing?.current_stock || 0) + quantity;
   else if (mode === 'decrement') newStock = (existing?.current_stock || 0) - quantity;

   await db.from('inventory_item_stores').upsert({
      item_id: itemId,
      store_id: storeId,
      current_stock: Math.max(0, newStock)
   }, { onConflict: 'item_id,store_id' });
}
