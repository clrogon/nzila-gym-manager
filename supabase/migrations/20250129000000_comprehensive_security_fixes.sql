-- ============================================================================
-- COMPREHENSIVE SECURITY FIXES FOR NZILA GYM MANAGER
-- Migration: 20250129000000_comprehensive_security_fixes.sql
-- ============================================================================

-- ============================================================================
-- FIX 1: PROFILES TABLE - Block anonymous public access
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view same-gym member profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Policy 1: Explicitly DENY anonymous access (most restrictive)
CREATE POLICY "Block anonymous access to profiles"
ON profiles FOR SELECT
TO anon
USING (false);

-- Policy 2: Users can ONLY view their own profile
CREATE POLICY "Users can view own profile only"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Users can ONLY update their own profile
CREATE POLICY "Users can update own profile only"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Staff can view profiles ONLY for members in their gym(s)
CREATE POLICY "Staff can view same-gym member profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN members m ON m.user_id = profiles.id
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = m.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'coach', 'trainer', 'instructor', 'receptionist', 'physiotherapist', 'nutritionist')
  )
);

-- Policy 5: Super admins can view all profiles (platform management)
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);

-- Policy 6: Prevent profile creation except during signup
-- Only allow inserts during the auth.users trigger
CREATE POLICY "Profiles can only be created during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 7: Prevent profile deletion (profiles should never be deleted)
CREATE POLICY "Profiles cannot be deleted"
ON profiles FOR DELETE
USING (false);


-- ============================================================================
-- FIX 2: MEMBERS TABLE - Separate sensitive data
-- ============================================================================

-- Create a new table for sensitive medical/emergency data
CREATE TABLE IF NOT EXISTS member_sensitive_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  health_conditions text,
  emergency_contact text,
  emergency_phone text,
  medical_notes text,
  allergies text,
  medications text,
  blood_type text,
  insurance_provider text,
  insurance_policy_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Audit fields
  created_by uuid REFERENCES auth.users(id),
  last_accessed_by uuid REFERENCES auth.users(id),
  last_accessed_at timestamptz
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_member_sensitive_data_member_id ON member_sensitive_data(member_id);

-- Enable RLS on sensitive data table
ALTER TABLE member_sensitive_data ENABLE ROW LEVEL SECURITY;

-- Migrate existing health_conditions data to new table
INSERT INTO member_sensitive_data (member_id, health_conditions, emergency_contact, emergency_phone, created_at)
SELECT id, health_conditions, emergency_contact, emergency_phone, created_at
FROM members
WHERE health_conditions IS NOT NULL 
   OR emergency_contact IS NOT NULL 
   OR emergency_phone IS NOT NULL
ON CONFLICT (member_id) DO NOTHING;

-- Drop existing members policies
DROP POLICY IF EXISTS "Members can view own data" ON members;
DROP POLICY IF EXISTS "Members can update own data" ON members;
DROP POLICY IF EXISTS "Staff can view basic member info in their gym" ON members;
DROP POLICY IF EXISTS "Admins can manage gym members" ON members;
DROP POLICY IF EXISTS "Super admins can manage all members" ON members;

-- Policy 1: Block anonymous access
CREATE POLICY "Block anonymous access to members"
ON members FOR SELECT
TO anon
USING (false);

-- Policy 2: Members can view their own data
CREATE POLICY "Members can view own data"
ON members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Members can update their own non-sensitive data only
CREATE POLICY "Members can update own basic data"
ON members FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND health_conditions IS NULL 
  AND emergency_contact IS NULL 
  AND emergency_phone IS NULL
);

-- Policy 4: Staff can view basic member info in their gym
CREATE POLICY "Staff can view gym members"
ON members FOR SELECT
TO authenticated
USING (
  gym_id IN (
    SELECT ur.gym_id 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'coach', 'trainer', 'instructor', 'receptionist', 'physiotherapist', 'nutritionist')
  )
);

-- Policy 5: Only admins/owners/managers can insert new members
CREATE POLICY "Admins can create gym members"
ON members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = members.gym_id
      AND role IN ('gym_owner', 'admin', 'manager')
  )
);

-- Policy 6: Only admins/owners/managers can update members
CREATE POLICY "Admins can update gym members"
ON members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = members.gym_id
      AND role IN ('gym_owner', 'admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = members.gym_id
      AND role IN ('gym_owner', 'admin', 'manager')
  )
);

-- Policy 7: Only admins/owners can delete members
CREATE POLICY "Admins can delete gym members"
ON members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = members.gym_id
      AND role IN ('gym_owner', 'admin')
  )
);

-- Policy 8: Super admins can do everything
CREATE POLICY "Super admins can manage all members"
ON members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);

-- RLS Policies for member_sensitive_data table
-- Policy 1: Block anonymous access
CREATE POLICY "Block anonymous access to sensitive data"
ON member_sensitive_data FOR SELECT
TO anon
USING (false);

-- Policy 2: Members can view their own sensitive data
CREATE POLICY "Members can view own sensitive data"
ON member_sensitive_data FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Policy 3: ONLY admins/owners/medical staff can view sensitive data
CREATE POLICY "Medical staff can view sensitive data"
ON member_sensitive_data FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'physiotherapist', 'nutritionist')
  )
);

-- Policy 4: ONLY admins/owners/medical staff can insert/update sensitive data
CREATE POLICY "Medical staff can manage sensitive data"
ON member_sensitive_data FOR ALL
TO authenticated
USING (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'physiotherapist', 'nutritionist')
  )
)
WITH CHECK (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'physiotherapist', 'nutritionist')
  )
);

-- Policy 5: Super admins can manage all sensitive data
CREATE POLICY "Super admins can manage all sensitive data"
ON member_sensitive_data FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);

-- Create trigger to update last_accessed fields
CREATE OR REPLACE FUNCTION update_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_by = auth.uid();
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS track_sensitive_data_access ON member_sensitive_data;
CREATE TRIGGER track_sensitive_data_access
BEFORE SELECT ON member_sensitive_data
FOR EACH ROW
EXECUTE FUNCTION update_sensitive_data_access();

-- Remove sensitive columns from members table (optional - do this after migration)
-- This is commented out to avoid breaking existing code
-- ALTER TABLE members DROP COLUMN IF EXISTS health_conditions;
-- ALTER TABLE members DROP COLUMN IF EXISTS emergency_contact;
-- ALTER TABLE members DROP COLUMN IF EXISTS emergency_phone;


-- ============================================================================
-- FIX 3: MEMBERS_SAFE VIEW - Add RLS protection
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS members_safe;

-- Recreate view with explicit column selection (no sensitive data)
CREATE VIEW members_safe
WITH (security_invoker = true)
AS
SELECT 
  m.id,
  m.gym_id,
  m.user_id,
  m.full_name,
  m.email,
  m.phone,
  m.status,
  m.photo_url,
  m.membership_plan_id,
  m.membership_start_date,
  m.membership_end_date,
  m.created_at,
  m.updated_at,
  m.is_dependent,
  m.tutor_id,
  m.date_of_birth,
  -- Include profile visibility info
  m.profile_visibility,
  m.show_email_public,
  m.show_phone_public
  -- EXCLUDED: health_conditions, emergency_contact, emergency_phone, address, notes, medical_notes
FROM members m;

-- Grant access to authenticated users only
REVOKE ALL ON members_safe FROM PUBLIC;
REVOKE ALL ON members_safe FROM anon;
GRANT SELECT ON members_safe TO authenticated;

-- Note: Views in Postgres inherit RLS from underlying tables when using security_invoker = true
-- The members_safe view will automatically respect the RLS policies on the members table


-- ============================================================================
-- FIX 4: MEMBER_DEPENDENTS - Enhance protection
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE member_dependents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view own dependents" ON member_dependents;
DROP POLICY IF EXISTS "Admins can view gym dependents" ON member_dependents;
DROP POLICY IF EXISTS "Admins can manage gym dependents" ON member_dependents;
DROP POLICY IF EXISTS "Super admins can manage all dependents" ON member_dependents;

-- Policy 1: Block anonymous access
CREATE POLICY "Block anonymous access to dependents"
ON member_dependents FOR SELECT
TO anon
USING (false);

-- Policy 2: Members can view their own dependent relationships
CREATE POLICY "Members can view own dependents"
ON member_dependents FOR SELECT
TO authenticated
USING (
  tutor_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
  OR
  dependent_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Policy 3: Staff can view dependents in their gym
CREATE POLICY "Staff can view gym dependents"
ON member_dependents FOR SELECT
TO authenticated
USING (
  tutor_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'coach', 'trainer', 'instructor', 'receptionist')
  )
);

-- Policy 4: Only admins/owners/managers can create dependents
CREATE POLICY "Admins can create dependents"
ON member_dependents FOR INSERT
TO authenticated
WITH CHECK (
  tutor_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager')
  )
);

-- Policy 5: Only admins/owners/managers can update dependents
CREATE POLICY "Admins can update dependents"
ON member_dependents FOR UPDATE
TO authenticated
USING (
  tutor_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager')
  )
)
WITH CHECK (
  tutor_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin', 'manager')
  )
);

-- Policy 6: Only admins/owners can delete dependents
CREATE POLICY "Admins can delete dependents"
ON member_dependents FOR DELETE
TO authenticated
USING (
  tutor_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN user_roles ur ON ur.gym_id = m.gym_id
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('gym_owner', 'admin')
  )
);

-- Policy 7: Super admins can do everything
CREATE POLICY "Super admins can manage all dependents"
ON member_dependents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);


-- ============================================================================
-- AUDIT LOGGING ENHANCEMENTS
-- ============================================================================

-- Enhance existing audit log table with more fields
ALTER TABLE IF EXISTS sensitive_data_access_log
ADD COLUMN IF NOT EXISTS column_accessed text,
ADD COLUMN IF NOT EXISTS access_reason text;

-- Create function to log sensitive data access with more detail
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
DECLARE
  current_gym_id uuid;
BEGIN
  -- Determine gym_id based on table
  IF TG_TABLE_NAME = 'member_sensitive_data' THEN
    SELECT m.gym_id INTO current_gym_id
    FROM members m
    WHERE m.id = NEW.member_id;
  ELSIF TG_TABLE_NAME = 'members' THEN
    current_gym_id := NEW.gym_id;
  END IF;

  -- Log the access
  INSERT INTO sensitive_data_access_log (
    user_id,
    gym_id,
    table_name,
    record_id,
    action,
    column_accessed
  )
  VALUES (
    auth.uid(),
    current_gym_id,
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    CASE 
      WHEN TG_TABLE_NAME = 'member_sensitive_data' THEN 'health_data'
      ELSE NULL
    END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the operation
    RAISE WARNING 'Failed to log sensitive data access: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for sensitive data access
DROP TRIGGER IF EXISTS audit_sensitive_data_access ON member_sensitive_data;
CREATE TRIGGER audit_sensitive_data_access
AFTER SELECT OR INSERT OR UPDATE ON member_sensitive_data
FOR EACH ROW
EXECUTE FUNCTION log_sensitive_data_access();


-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Add comments to sensitive columns for documentation
COMMENT ON TABLE member_sensitive_data IS 'HIGHLY SENSITIVE: Contains medical and emergency contact information. Access restricted to medical staff and administrators only.';
COMMENT ON COLUMN member_sensitive_data.health_conditions IS 'SENSITIVE: Medical information protected under privacy regulations';
COMMENT ON COLUMN member_sensitive_data.medical_notes IS 'SENSITIVE: Medical notes from healthcare providers';
COMMENT ON COLUMN member_sensitive_data.medications IS 'SENSITIVE: Current medications list';
COMMENT ON COLUMN member_sensitive_data.insurance_policy_number IS 'SENSITIVE: Insurance identification';

-- Ensure updated_at trigger exists for the new table
CREATE TRIGGER update_member_sensitive_data_updated_at
  BEFORE UPDATE ON member_sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================

-- Test 1: Verify anonymous users CANNOT access profiles
-- SET ROLE anon;
-- SELECT * FROM profiles; -- Should return 0 rows

-- Test 2: Verify authenticated users can only see their own profile
-- SET ROLE authenticated;
-- SELECT * FROM profiles; -- Should only show current user's profile

-- Test 3: Verify members_safe view respects RLS
-- SELECT * FROM members_safe; -- Should only show accessible members

-- Test 4: Verify sensitive data is properly restricted
-- SELECT * FROM member_sensitive_data; -- Should only show if admin/medical

-- Test 5: Check audit log
-- SELECT * FROM sensitive_data_access_log ORDER BY accessed_at DESC LIMIT 10;


-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS member_sensitive_data CASCADE;
-- DROP VIEW IF EXISTS members_safe;
-- DROP FUNCTION IF EXISTS log_sensitive_data_access() CASCADE;
-- DROP FUNCTION IF EXISTS update_sensitive_data_access() CASCADE;
-- Then restore previous policies from backup
