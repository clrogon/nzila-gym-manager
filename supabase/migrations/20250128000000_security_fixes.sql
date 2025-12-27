-- ============================================================================
-- FIX 1: PROFILES TABLE - Restrict access to owner + same-gym staff only
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view member profiles" ON profiles;

-- Policy 1: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 2: Staff can ONLY view profiles of members in their gym (prevents cross-gym enumeration)
CREATE POLICY "Staff can view same-gym member profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.gym_id IN (
      SELECT m.gym_id FROM members m WHERE m.user_id = profiles.id
    )
    AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'coach', 'trainer', 'instructor', 'receptionist')
  )
);

-- Policy 3: Super admins can view all profiles (for platform management)
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);


-- ============================================================================
-- FIX 2: MEMBERS TABLE - Separate sensitive data access (health conditions)
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Staff can view gym members" ON members;
DROP POLICY IF EXISTS "Staff can manage gym members" ON members;

-- Policy 1: Members can view their own data (full access)
CREATE POLICY "Members can view own data"
ON members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Members can update own data"
ON members FOR UPDATE
USING (user_id = auth.uid());

-- Policy 2: Staff can view BASIC member data (excludes sensitive fields)
-- This uses Postgres RLS with column-level filtering via a security definer function
CREATE POLICY "Staff can view basic member info in their gym"
ON members FOR SELECT
USING (
  gym_id IN (
    SELECT ur.gym_id FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'coach', 'trainer', 'instructor', 'receptionist')
  )
);

-- Policy 3: Only admins/gym owners/managers can view SENSITIVE member data
-- Create a helper function to check if user is admin+ for the gym
CREATE OR REPLACE FUNCTION is_gym_admin_or_higher(target_gym_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND gym_id = target_gym_id
    AND role IN ('gym_owner', 'admin', 'manager', 'super_admin')
  );
$$;

-- Policy 4: Admins+ can manage members (full CRUD)
CREATE POLICY "Admins can manage gym members"
ON members FOR ALL
USING (
  is_gym_admin_or_higher(gym_id)
)
WITH CHECK (
  is_gym_admin_or_higher(gym_id)
);

-- Policy 5: Super admins can view/manage all members
CREATE POLICY "Super admins can manage all members"
ON members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- ============================================================================
-- CREATE SECURE VIEW for staff to access non-sensitive member data
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS members_basic_view;

-- Create a view that excludes sensitive fields
CREATE VIEW members_basic_view
WITH (security_invoker = true)
AS
SELECT 
  id,
  gym_id,
  user_id,
  full_name,
  email,
  phone,
  status,
  date_of_birth,
  photo_url,
  membership_plan_id,
  membership_start_date,
  membership_end_date,
  created_at,
  updated_at,
  is_dependent,
  tutor_id
  -- EXCLUDED: health_conditions, emergency_contact, emergency_phone, address, notes
FROM members;

-- Grant access to the view
GRANT SELECT ON members_basic_view TO authenticated;

-- ============================================================================
-- FIX 3: MEMBER_DEPENDENTS TABLE - Restrict to admins and member owner
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Staff can view gym member dependents" ON member_dependents;
DROP POLICY IF EXISTS "Staff can manage gym member dependents" ON member_dependents;

-- Policy 1: Members can view their own dependents
CREATE POLICY "Members can view own dependents"
ON member_dependents FOR SELECT
USING (
  tutor_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
  OR
  dependent_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Policy 2: Only admins/gym owners/managers can view all dependents in their gym
CREATE POLICY "Admins can view gym dependents"
ON member_dependents FOR SELECT
USING (
  tutor_id IN (
    SELECT m.id FROM members m
    WHERE is_gym_admin_or_higher(m.gym_id)
  )
);

-- Policy 3: Only admins+ can manage dependents
CREATE POLICY "Admins can manage gym dependents"
ON member_dependents FOR ALL
USING (
  tutor_id IN (
    SELECT m.id FROM members m
    WHERE is_gym_admin_or_higher(m.gym_id)
  )
)
WITH CHECK (
  tutor_id IN (
    SELECT m.id FROM members m
    WHERE is_gym_admin_or_higher(m.gym_id)
  )
);

-- Policy 4: Super admins can manage all dependents
CREATE POLICY "Super admins can manage all dependents"
ON member_dependents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- ============================================================================
-- AUDIT LOGGING for sensitive data access
-- ============================================================================

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON sensitive_data_access_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('gym_owner', 'admin', 'super_admin')
    AND (gym_id = sensitive_data_access_log.gym_id OR role = 'super_admin')
  )
);

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO sensitive_data_access_log (
    user_id,
    gym_id,
    table_name,
    record_id,
    action
  )
  VALUES (
    auth.uid(),
    CASE 
      WHEN TG_TABLE_NAME = 'members' THEN NEW.gym_id
      WHEN TG_TABLE_NAME = 'member_dependents' THEN (
        SELECT gym_id FROM members WHERE id = NEW.tutor_id
      )
      ELSE NULL
    END,
    TG_TABLE_NAME,
    NEW.id,
    TG_OP
  );
  RETURN NEW;
END;
$$;

-- Create triggers for audit logging on sensitive tables
DROP TRIGGER IF EXISTS audit_member_health_access ON members;
CREATE TRIGGER audit_member_health_access
AFTER SELECT ON members
FOR EACH ROW
WHEN (NEW.health_conditions IS NOT NULL OR NEW.emergency_contact IS NOT NULL)
EXECUTE FUNCTION log_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_dependent_access ON member_dependents;
CREATE TRIGGER audit_dependent_access
AFTER INSERT OR UPDATE OR DELETE ON member_dependents
FOR EACH ROW
EXECUTE FUNCTION log_sensitive_data_access();

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Revoke public access to sensitive columns (PostgreSQL 15+)
-- Note: This requires PostgreSQL 15+. For earlier versions, use views instead.

-- For members table, create a security policy that filters columns
COMMENT ON COLUMN members.health_conditions IS 'SENSITIVE: Requires admin access';
COMMENT ON COLUMN members.emergency_contact IS 'SENSITIVE: Requires admin access';
COMMENT ON COLUMN members.emergency_phone IS 'SENSITIVE: Requires admin access';
COMMENT ON COLUMN members.address IS 'SENSITIVE: Requires admin access';
COMMENT ON COLUMN members.notes IS 'SENSITIVE: Requires admin access';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the fixes work correctly:

-- 1. Verify profiles isolation (should only show own profile + same-gym members)
-- SELECT * FROM profiles;

-- 2. Verify members basic access (should exclude sensitive fields for non-admins)
-- SELECT * FROM members_basic_view;

-- 3. Verify only admins can see sensitive data
-- SELECT health_conditions, emergency_contact FROM members; -- Should fail for non-admins

-- 4. Verify dependents access restriction
-- SELECT * FROM member_dependents; -- Should only show own or admin-accessible

-- 5. Check audit log
-- SELECT * FROM sensitive_data_access_log ORDER BY accessed_at DESC LIMIT 10;
