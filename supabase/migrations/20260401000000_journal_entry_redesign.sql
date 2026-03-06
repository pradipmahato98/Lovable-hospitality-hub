-- Add missing columns to journal_entries and journal_lines
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS miti TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fiscal_year TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS voucher_type TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS finance_book TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS from_template TEXT;

ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS sub_ledger TEXT;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS party_type TEXT;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES profiles(id);
