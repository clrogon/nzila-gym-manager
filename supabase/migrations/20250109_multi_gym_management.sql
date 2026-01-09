-- Multi-Gym Management
-- Allow gym owners to manage multiple gyms with proper hierarchy

-- Add gym chains/organizations
CREATE TABLE IF NOT EXISTS gym_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link gyms to chains
ALTER TABLE gyms ADD COLUMN chain_id UUID REFERENCES gym_chains(id);

-- Add gym relationship types to user_roles
ALTER TABLE user_roles ADD COLUMN relationship_type TEXT 
  CHECK (relationship_type IN ('owner', 'manager', 'staff', 'member'));

-- Add primary gym indicator
ALTER TABLE user_roles ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

-- Allow members to access multiple gyms
CREATE TABLE IF NOT EXISTS member_gym_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('full', 'limited', 'day_pass')),
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, gym_id),
  INDEX idx_member_gym_access_member (member_id),
  INDEX idx_member_gym_access_gym (gym_id)
);

-- Staff can be assigned to multiple gyms
CREATE TABLE IF NOT EXISTS staff_gym_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, gym_id),
  INDEX idx_staff_gym_assignments_user (user_id),
  INDEX idx_staff_gym_assignments_gym (gym_id)
);

-- Update gym subscription to support multiple gyms
ALTER TABLE gym_subscriptions ADD COLUMN chain_id UUID REFERENCES gym_chains(id);

-- Function to check if user can create a gym
CREATE OR REPLACE FUNCTION can_create_gym(user_id UUID, chain_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = $1
      AND relationship_type = 'owner'
    )
    AND (
      -- Check subscription limits if chain has subscription
      chain_id IS NULL OR
      (
        SELECT COUNT(*) < COALESCE(
          (SELECT pp.max_members FROM platform_plans pp
          JOIN gym_subscriptions gs ON gs.plan_id = pp.id
          JOIN gym_chains gc ON gs.chain_id = gc.id
          WHERE gc.id = $2
          AND gs.status = 'active'
          LIMIT 1
        ), 0)
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's gym chain
CREATE OR REPLACE FUNCTION get_user_chain(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  owner_id UUID,
  settings JSONB,
  branding JSONB
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      gc.id,
      gc.name,
      gc.owner_id,
      gc.settings,
      gc.branding
    FROM gym_chains gc
    WHERE gc.owner_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all gyms for a chain
CREATE OR REPLACE FUNCTION get_chain_gyms(chain_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subscription_status TEXT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      g.id,
      g.name,
      g.subscription_status,
      (SELECT COUNT(*) FROM user_roles WHERE gym_id = g.id) as member_count
    FROM gyms g
    WHERE g.chain_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for multi-gym management
DROP POLICY IF EXISTS "Users can view their gyms" ON gyms;
CREATE POLICY "Users can view gyms they have access to"
ON gyms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = gyms.id
  )
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Gym members can read their gym" ON gyms;
CREATE POLICY "Gym members can read their gyms"
ON gyms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM member_gym_access
    WHERE member_id = auth.uid()
      AND gym_id = gyms.id
      AND is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Users can create gyms" ON gyms;
CREATE POLICY "Users can create gyms if allowed"
ON gyms FOR INSERT
WITH CHECK (can_create_gym(auth.uid(), chain_id));

-- RLS for member_gym_access
ALTER TABLE member_gym_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their gym access"
ON member_gym_access FOR SELECT
TO authenticated
USING (member_id = auth.uid());

CREATE POLICY "Gym owners can assign member access"
ON member_gym_access FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = member_gym_access.gym_id
      AND relationship_type IN ('owner', 'manager', 'admin')
  )
);

CREATE POLICY "Gym owners can update member access"
ON member_gym_access FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = member_gym_access.gym_id
      AND relationship_type IN ('owner', 'manager', 'admin')
  )
);

-- RLS for staff_gym_assignments
ALTER TABLE staff_gym_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gym assignments"
ON staff_gym_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Gym owners can assign staff to gyms"
ON staff_gym_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = staff_gym_assignments.gym_id
      AND relationship_type IN ('owner', 'manager', 'admin')
  )
);

CREATE POLICY "Gym owners can update staff assignments"
ON staff_gym_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND gym_id = staff_gym_assignments.gym_id
      AND relationship_type IN ('owner', 'manager', 'admin')
  )
);

-- RLS for gym_chains
ALTER TABLE gym_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chains"
ON gym_chains FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can create chains"
ON gym_chains FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their chains"
ON gym_chains FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- Comments
COMMENT ON TABLE gym_chains IS 'Groups multiple gyms under one organization/chain';
COMMENT ON TABLE member_gym_access IS 'Allows members to access multiple gyms (full access, day passes, etc.)';
COMMENT ON TABLE staff_gym_assignments IS 'Assigns staff to work at multiple gyms';
COMMENT ON FUNCTION can_create_gym IS 'Checks if user can create a new gym based on subscription limits';
COMMENT ON FUNCTION get_user_chain IS 'Returns the gym chain/organization for a user';
COMMENT ON FUNCTION get_chain_gyms IS 'Returns all gyms belonging to a chain';
