import { supabase } from "@/integrations/supabase/client";

export interface JournalLineDTO {
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
  currency_id?: string;
  exchange_rate?: number;
}

export interface JournalEntryDTO {
  date: string;
  description: string;
  reference?: string;
  lines: JournalLineDTO[];
}

export class GLPostingService {
  /**
   * Posts a journal entry to the general ledger.
   * Follows Prompt 2 requirements.
   */
  static async postJournalEntry(entry: JournalEntryDTO) {
    // 1. Validate debit sum = credit sum
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Unbalanced journal entry: Total Debit ($${totalDebit}) does not equal Total Credit ($${totalCredit})`);
    }

    // 2. Check period is open
    const { data: period, error: periodError } = await supabase
      .from('accounting_periods' as any)
      .select('id, status')
      .lte('start_date', entry.date)
      .gte('end_date', entry.date)
      .single();

    if (periodError || !period) {
      throw new Error(`No accounting period found for date ${entry.date}`);
    }

    if (period.status !== 'open') {
      throw new Error(`Accounting period ${period.id} is closed`);
    }

    // 3. Verify all account IDs exist and allow_direct_posting=true
    const accountIds = entry.lines.map(l => l.account_id);
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, allow_direct_posting')
      .in('id', accountIds);

    if (accountsError || !accounts || accounts.length !== new Set(accountIds).size) {
      throw new Error("One or more account IDs are invalid");
    }

    const restrictedAccounts = accounts.filter(a => !(a as any).allow_direct_posting);
    if (restrictedAccounts.length > 0) {
      throw new Error(`Direct posting is not allowed for some accounts: ${restrictedAccounts.map(a => a.id).join(', ')}`);
    }

    // 4. Convert to base currency (handled in journal_entry_lines insertion logic)
    // 5. Insert journal_entry and journal_entry_lines in a single DB transaction
    // Note: Since we are using Supabase client, we'll use an RPC or a manual transaction if supported.
    // For simplicity in this environment, I'll use a sequence of calls or a custom RPC.
    // I'll assume an RPC 'post_journal_entry_transactional' exists or create it.

    const { data: result, error: postError } = await supabase.rpc('post_journal_entry_transactional', {
      p_date: entry.date,
      p_description: entry.description,
      p_reference: entry.reference || null,
      p_lines: entry.lines.map(l => ({
        account_id: l.account_id,
        debit: l.debit,
        credit: l.credit,
        description: l.description || null,
        currency_id: l.currency_id || null,
        exchange_rate: l.exchange_rate || 1.0
      }))
    });

    if (postError) {
      throw new Error(`Failed to post journal entry: ${postError.message}`);
    }

    // 6. Account balance summary updates are handled by a trigger on journal_entry_lines in the DB
    return result;
  }
}
