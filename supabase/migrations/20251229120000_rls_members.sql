-- Enable RLS on members table (idempotent)
ALTER TABLE IF EXISTS public.members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe for re-runs)
DROP POLICY IF EXISTS "Super Admin full access to members" ON public.members;
DROP POLICY IF EXISTS "Gym Owner full access to own gym members" ON public.members;
DROP POLICY IF EXISTS "Manager full access to own gym members" ON public.members;
DROP POLICY IF EXISTS "Admin full access to own gym members" ON public.members;
DROP POLICY IF EXISTS "Receptionist CRUD own gym members (no delete)" ON public.members;
DROP POLICY IF EXISTS "Staff read-only own gym members" ON public.members;
DROP POLICY IF EXISTS "Coach/Trainer read assigned or own gym members" ON public.members;
DROP POLICY IF EXISTS "Member can only read self" ON public.members;

-- Helper: Get current user's role in current gym context
-- Assumes JWT claim `app_metadata.gym_id` is set by your frontend
-- ⚠️ You must set this in `GymContext` using `supabase.auth.updateUser()`
--    → See implementation note below

-- Policy 1: Super Admin — full access across all gyms
CREATE POLICY "Super Admin full access to members"
ON public.members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Policy 2: Gym Owner — full CRUD in own gym
CREATE POLICY "Gym Owner full access to own gym members"
ON public.members
FOR ALL
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'gym_owner'
  )
)
WITH CHECK (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'gym_owner'
  )
);

-- Policy 3: Manager — full CRUD in own gym
CREATE POLICY "Manager full access to own gym members"
ON public.members
FOR ALL
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'manager'
  )
)
WITH CHECK (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'manager'
  )
);

-- Policy 4: Admin — full CRUD in own gym
CREATE POLICY "Admin full access to own gym members"
ON public.members
FOR ALL
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'admin'
  )
)
WITH CHECK (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'admin'
  )
);

-- Policy 5: Receptionist — create/read/update, but NO delete
CREATE POLICY "Receptionist CRUD own gym members (no delete)"
ON public.members
FOR SELECT, INSERT, UPDATE
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'receptionist'
  )
)
WITH CHECK (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'receptionist'
  )
);

-- Policy 6: Staff — read-only in own gym
CREATE POLICY "Staff read-only own gym members"
ON public.members
FOR SELECT
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = gym_id
      AND ur.role = 'staff'
  )
);

-- Policy 7: Coach/Trainer — read members in own gym OR assigned to them
-- e.g., see members they train (via `member_coaches` or `assigned_trainer_id`)
CREATE POLICY "Coach/Trainer read assigned or own gym members"
ON public.members
FOR SELECT
TO authenticated
USING (
  gym_id = current_setting('app.current_gym', true)::uuid
  AND (
    -- Direct role access (e.g., coach in same gym)
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.gym_id = gym_id
        AND ur.role IN ('coach', 'trainer')
    )
    -- OR member is assigned to this user as coach/trainer
    OR EXISTS (
      SELECT 1 FROM public.member_assignments ma
      WHERE ma.member_id = id
        AND ma.assigned_staff_id = auth.uid()
        AND ma.gym_id = gym_id
    )
  )
);

-- Policy 8: Member — self-read only (implements `members:read:own`)
CREATE POLICY "Member can only read self"
ON public.members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()  -- assumes `members.user_id` links to `auth.users.id`
  AND role = 'member'   -- explicit: only applies to member accounts (not staff posing as member)
);

-- Optional: Block members from INSERT/UPDATE/DELETE entirely
-- (they should use profile self-service endpoints instead)
CREATE POLICY "Members cannot modify member records"
ON public.members
AS RESTRICTIVE
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (false)
WITH CHECK (false);
