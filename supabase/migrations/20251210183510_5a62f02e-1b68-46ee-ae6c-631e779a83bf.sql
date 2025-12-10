-- Create table to track gym owner invitations
CREATE TABLE public.gym_owner_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gym_name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  invited_by UUID NOT NULL,
  temp_password TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gym_owner_invitations ENABLE ROW LEVEL SECURITY;

-- Only super admins can view invitations
CREATE POLICY "Super admins can view all invitations"
  ON public.gym_owner_invitations
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Only super admins can create invitations
CREATE POLICY "Super admins can create invitations"
  ON public.gym_owner_invitations
  FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Only super admins can update invitations
CREATE POLICY "Super admins can update invitations"
  ON public.gym_owner_invitations
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

-- Add index for faster lookups
CREATE INDEX idx_gym_owner_invitations_email ON public.gym_owner_invitations(email);
CREATE INDEX idx_gym_owner_invitations_status ON public.gym_owner_invitations(status);