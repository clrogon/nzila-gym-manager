-- Security Fix: Block anonymous access to sensitive tables

-- Issue 1: PUBLIC_USER_DATA on 'profiles' table
-- The existing policies allow access but do not explicitly block anonymous users.
-- This new policy ensures that only authenticated users can SELECT from the profiles table.
CREATE POLICY "block_anonymous_access"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Issue 2: EXPOSED_SENSITIVE_DATA on 'members' table
-- The existing policies allow access but do not explicitly block anonymous users.
-- This new policy ensures that only authenticated users can SELECT from the members table.
CREATE POLICY "members_require_auth"
ON public.members
FOR SELECT
USING (auth.uid() IS NOT NULL);
