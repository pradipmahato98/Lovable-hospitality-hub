-- Add columns to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS miti TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fiscal_year TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS voucher_type TEXT;

-- Add column to journal_lines
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS sub_ledger TEXT;

-- Add attachments column to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
