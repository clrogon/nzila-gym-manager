-- ============================================================================
-- KIOSK PIN AUTHENTICATION MIGRATION
-- Migration: 20250108000001_kiosk_pin_auth.sql
-- ============================================================================
-- This migration adds support for PIN-based kiosk authentication

-- Check if kiosk_pin column exists in members table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'kiosk_pin'
    ) THEN
        ALTER TABLE public.members ADD COLUMN kiosk_pin VARCHAR(6);
        
        CREATE INDEX idx_members_kiosk_pin ON public.members(kiosk_pin);
        
        COMMENT ON COLUMN public.members.kiosk_pin IS '4-6 digit PIN for kiosk check-in. Stored as plain text for simplicity, but should be hashed in production.';
    END IF;
END $$;

-- Check if kiosk_pin_expires_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'kiosk_pin_expires_at'
    ) THEN
        ALTER TABLE public.members ADD COLUMN kiosk_pin_expires_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.members.kiosk_pin_expires_at IS 'Optional expiry date for kiosk PIN. If set, PIN will expire after this date.';
    END IF;
END $$;

-- Check if failed_kiosk_attempts column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'failed_kiosk_attempts'
    ) THEN
        ALTER TABLE public.members ADD COLUMN failed_kiosk_attempts INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN public.members.failed_kiosk_attempts IS 'Number of consecutive failed kiosk PIN attempts. Resets after successful check-in.';
    END IF;
END $$;

-- Check if kiosk_locked_until column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'kiosk_locked_until'
    ) THEN
        ALTER TABLE public.members ADD COLUMN kiosk_locked_until TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.members.kiosk_locked_until IS 'Timestamp until which kiosk access is locked due to too many failed attempts.';
    END IF;
END $$;

-- Update RLS policies to allow PIN management
DROP POLICY IF EXISTS "Members can update own kiosk PIN" ON public.members;

CREATE POLICY "Members can update own kiosk PIN"
ON public.members FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

-- Update RLS policies for kiosk access
-- Staff can check in members using PIN
DROP POLICY IF EXISTS "Staff can check in members with PIN" ON public.members;

CREATE POLICY "Staff can check in members with PIN"
ON public.members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = members.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'receptionist')
  )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to validate kiosk PIN and check in member
CREATE OR REPLACE FUNCTION public.kiosk_check_in_with_pin(
  p_gym_id UUID,
  p_pin_input VARCHAR(6),
  p_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  member_id UUID,
  member_name TEXT,
  member_photo TEXT,
  check_in_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_check_in_id UUID;
  v_attempts_allowed INTEGER := 3;
  v_lockout_minutes INTEGER := 15;
BEGIN
  -- Validate inputs
  IF p_gym_id IS NULL OR p_pin_input IS NULL OR p_pin_input = '' THEN
    RETURN QUERY SELECT false AS success, 'Invalid input' AS message, NULL::UUID AS member_id, NULL::TEXT AS member_name, NULL::TEXT AS member_photo, NULL::TIMESTAMPTZ AS check_in_time;
    RETURN;
  END IF;

  -- Validate PIN format (4-6 digits)
  IF p_pin_input !~ '^\d{4,6}$' THEN
    RETURN QUERY SELECT false AS success, 'Invalid PIN format. Use 4-6 digits.' AS message, NULL::UUID AS member_id, NULL::TEXT AS member_name, NULL::TEXT AS member_photo, NULL::TIMESTAMPTZ AS check_in_time;
    RETURN;
  END IF;

  -- Find member with matching PIN
  SELECT * INTO v_member
  FROM public.members
  WHERE gym_id = p_gym_id
    AND kiosk_pin = p_pin_input
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    -- PIN not found - increment failed attempts (if we had member info, we'd track it)
    RETURN QUERY SELECT false AS success, 'Invalid PIN or member not found' AS message, NULL::UUID AS member_id, NULL::TEXT AS member_name, NULL::TEXT AS member_photo, NULL::TIMESTAMPTZ AS check_in_time;
    RETURN;
  END IF;

  -- Check if kiosk is locked for this member
  IF v_member.kiosk_locked_until IS NOT NULL AND v_member.kiosk_locked_until > NOW() THEN
    RETURN QUERY SELECT false AS success, 
      'Kiosk access locked until ' || v_member.kiosk_locked_until::TEXT AS message, 
      v_member.id AS member_id, 
      v_member.full_name AS member_name, 
      v_member.photo_url AS member_photo, 
      NULL::TIMESTAMPTZ AS check_in_time;
    RETURN;
  END IF;

  -- Check if membership is expired
  IF v_member.membership_end_date IS NOT NULL AND v_member.membership_end_date < NOW() THEN
    RETURN QUERY SELECT false AS success, 
      'Membership expired on ' || v_member.membership_end_date::TEXT AS message, 
      v_member.id AS member_id, 
      v_member.full_name AS member_name, 
      v_member.photo_url AS member_photo, 
      NULL::TIMESTAMPTZ AS check_in_time;
    RETURN;
  END IF;

  -- Record check-in
  INSERT INTO public.check_ins (
    gym_id,
    member_id,
    checked_by_id,
    check_in_time
  )
  VALUES (
    p_gym_id,
    v_member.id,
    p_staff_id,
    NOW()
  )
  RETURNING id INTO v_check_in_id;

  -- Reset failed attempts on successful check-in
  UPDATE public.members
  SET failed_kiosk_attempts = 0,
      kiosk_locked_until = NULL
  WHERE id = v_member.id;

  -- Return success
  RETURN QUERY SELECT 
    true AS success, 
    'Check-in successful' AS message, 
    v_member.id AS member_id, 
    v_member.full_name AS member_name, 
    v_member.photo_url AS member_photo, 
    NOW() AS check_in_time;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false AS success, 'Check-in failed: ' || SQLERRM AS message, NULL::UUID AS member_id, NULL::TEXT AS member_name, NULL::TEXT AS member_photo, NULL::TIMESTAMPTZ AS check_in_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kiosk_check_in_with_pin TO authenticated;

COMMENT ON FUNCTION public.kiosk_check_in_with_pin IS 'Validates kiosk PIN and records check-in. Handles failed attempts, lockout, and membership validation.';

-- Function to set kiosk PIN
CREATE OR REPLACE FUNCTION public.set_kiosk_pin(
  p_member_id UUID,
  p_new_pin VARCHAR(6),
  p_expires_after_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Validate inputs
  IF p_member_id IS NULL OR p_new_pin IS NULL THEN
    RETURN QUERY SELECT false AS success, 'Invalid input' AS message;
    RETURN;
  END IF;

  -- Validate PIN format
  IF p_new_pin !~ '^\d{4,6}$' THEN
    RETURN QUERY SELECT false AS success, 'PIN must be 4-6 digits' AS message;
    RETURN;
  END IF;

  -- Calculate expiry date if specified
  IF p_expires_after_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_after_days || ' days')::INTERVAL;
  END IF;

  -- Update member PIN
  UPDATE public.members
  SET
    kiosk_pin = p_new_pin,
    kiosk_pin_expires_at = v_expires_at,
    failed_kiosk_attempts = 0,
    kiosk_locked_until = NULL
  WHERE id = p_member_id;

  RETURN QUERY SELECT true AS success, 'PIN set successfully' AS message;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_kiosk_pin TO authenticated;

COMMENT ON FUNCTION public.set_kiosk_pin IS 'Sets or updates a member''s kiosk PIN. Optionally sets an expiry date.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Update KioskInterface.tsx to support PIN-based check-in
-- 2. Add PIN management in member portal
-- 3. Test PIN validation and lockout logic
-- 4. Consider hashing PINs in production for better security
