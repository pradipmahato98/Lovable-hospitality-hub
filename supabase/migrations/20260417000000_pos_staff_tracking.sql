-- Add created_by to pos_transactions for staff tracking
ALTER TABLE public.pos_transactions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update RLS for pos_transactions to allow staff to see all (for auditing)
DROP POLICY IF EXISTS "Staff can view all transactions" ON public.pos_transactions;
CREATE POLICY "Staff can view all transactions" ON public.pos_transactions
FOR SELECT USING (public.is_staff(auth.uid()));
