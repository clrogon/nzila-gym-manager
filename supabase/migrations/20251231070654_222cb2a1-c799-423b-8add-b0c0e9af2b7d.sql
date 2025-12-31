-- Add RLS policies for member self-access on check_ins

-- Allow members to read their own check-ins
CREATE POLICY "Members can view own check_ins"
ON public.check_ins FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to create their own check-ins
CREATE POLICY "Members can create own check_ins"
ON public.check_ins FOR INSERT
TO authenticated
WITH CHECK (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to view their own payments
CREATE POLICY "Members can view own payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to view their own invoices
CREATE POLICY "Members can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to view their own class bookings
CREATE POLICY "Members can view own class_bookings"
ON public.class_bookings FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to view their own ranks
CREATE POLICY "Members can view own member_ranks"
ON public.member_ranks FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);

-- Allow members to view their own performance records
CREATE POLICY "Members can view own performance_records"
ON public.performance_records FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.members 
    WHERE user_id = auth.uid()
  )
);