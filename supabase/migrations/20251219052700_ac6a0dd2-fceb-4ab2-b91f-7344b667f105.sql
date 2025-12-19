-- Add banking fields to gyms table for IBAN validation
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS bank_beneficiary TEXT;

-- Add proof tracking to payments table for Multicaixa receipts
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_transaction_id TEXT;

-- Add invoice_id to payments for linking
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id);

-- Create bank_reconciliation table for tracking imported bank statements
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_transactions INTEGER DEFAULT 0,
  matched_transactions INTEGER DEFAULT 0,
  unmatched_transactions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_reconciliation_items for individual transaction lines
CREATE TABLE IF NOT EXISTS public.bank_reconciliation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_id UUID NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  reference TEXT,
  matched_payment_id UUID REFERENCES public.payments(id),
  status TEXT DEFAULT 'unmatched',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_reconciliations
CREATE POLICY "Users can view reconciliations in their gyms" 
ON public.bank_reconciliations 
FOR SELECT 
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Users can create reconciliations in their gyms" 
ON public.bank_reconciliations 
FOR INSERT 
WITH CHECK (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

CREATE POLICY "Users can update reconciliations in their gyms" 
ON public.bank_reconciliations 
FOR UPDATE 
USING (has_gym_role(auth.uid(), gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role]));

-- RLS policies for bank_reconciliation_items
CREATE POLICY "Users can view reconciliation items" 
ON public.bank_reconciliation_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bank_reconciliations br 
  WHERE br.id = reconciliation_id 
  AND has_gym_role(auth.uid(), br.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role])
));

CREATE POLICY "Users can manage reconciliation items" 
ON public.bank_reconciliation_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.bank_reconciliations br 
  WHERE br.id = reconciliation_id 
  AND has_gym_role(auth.uid(), br.gym_id, ARRAY['super_admin'::app_role, 'gym_owner'::app_role, 'admin'::app_role])
));