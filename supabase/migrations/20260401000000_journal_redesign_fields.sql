-- Add redesigned journal entry fields
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS voucher_type text,
ADD COLUMN IF NOT EXISTS miti text,
ADD COLUMN IF NOT EXISTS fiscal_year text,
ADD COLUMN IF NOT EXISTS series text,
ADD COLUMN IF NOT EXISTS company_id text,
ADD COLUMN IF NOT EXISTS finance_book text,
ADD COLUMN IF NOT EXISTS from_template text;

-- Add redesigned journal line fields
ALTER TABLE public.journal_lines
ADD COLUMN IF NOT EXISTS party_type text,
ADD COLUMN IF NOT EXISTS party_id text,
ADD COLUMN IF NOT EXISTS sub_ledger text;
