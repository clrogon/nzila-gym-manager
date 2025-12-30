-- Add explicit DENY policies for anonymous users on all sensitive tables
-- This ensures anonymous/unauthenticated users cannot access any data

-- Profiles - deny anon access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false);

-- Members - deny anon access
CREATE POLICY "Deny anonymous access to members" 
ON public.members 
FOR ALL 
TO anon
USING (false);

-- Member sensitive data - deny anon access
CREATE POLICY "Deny anonymous access to member_sensitive_data" 
ON public.member_sensitive_data 
FOR ALL 
TO anon
USING (false);

-- Leads - deny anon access  
CREATE POLICY "Deny anonymous access to leads" 
ON public.leads 
FOR ALL 
TO anon
USING (false);

-- Payments - deny anon access
CREATE POLICY "Deny anonymous access to payments" 
ON public.payments 
FOR ALL 
TO anon
USING (false);

-- Invoices - deny anon access
CREATE POLICY "Deny anonymous access to invoices" 
ON public.invoices 
FOR ALL 
TO anon
USING (false);

-- Invoice items - deny anon access
CREATE POLICY "Deny anonymous access to invoice_items" 
ON public.invoice_items 
FOR ALL 
TO anon
USING (false);

-- Gym owner invitations - deny anon access
CREATE POLICY "Deny anonymous access to gym_owner_invitations" 
ON public.gym_owner_invitations 
FOR ALL 
TO anon
USING (false);

-- Bank reconciliations - deny anon access
CREATE POLICY "Deny anonymous access to bank_reconciliations" 
ON public.bank_reconciliations 
FOR ALL 
TO anon
USING (false);

-- Bank reconciliation items - deny anon access
CREATE POLICY "Deny anonymous access to bank_reconciliation_items" 
ON public.bank_reconciliation_items 
FOR ALL 
TO anon
USING (false);

-- Gyms - deny anon access (contains bank details)
CREATE POLICY "Deny anonymous access to gyms" 
ON public.gyms 
FOR ALL 
TO anon
USING (false);

-- Check-ins - deny anon access
CREATE POLICY "Deny anonymous access to check_ins" 
ON public.check_ins 
FOR ALL 
TO anon
USING (false);

-- Class bookings - deny anon access
CREATE POLICY "Deny anonymous access to class_bookings" 
ON public.class_bookings 
FOR ALL 
TO anon
USING (false);

-- User roles - deny anon access
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR ALL 
TO anon
USING (false);

-- Auth events - deny anon access
CREATE POLICY "Deny anonymous access to auth_events" 
ON public.auth_events 
FOR ALL 
TO anon
USING (false);

-- Audit logs - deny anon access
CREATE POLICY "Deny anonymous access to audit_logs" 
ON public.audit_logs 
FOR ALL 
TO anon
USING (false);

-- Sales - deny anon access
CREATE POLICY "Deny anonymous access to sales" 
ON public.sales 
FOR ALL 
TO anon
USING (false);

-- Sale items - deny anon access
CREATE POLICY "Deny anonymous access to sale_items" 
ON public.sale_items 
FOR ALL 
TO anon
USING (false);