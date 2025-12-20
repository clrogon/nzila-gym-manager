-- =====================================================
-- BOOKING SYSTEM SECURITY ENHANCEMENTS
-- =====================================================

-- Add missing columns to class_bookings if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_bookings' 
    AND column_name = 'promoted_at'
  ) THEN
    ALTER TABLE class_bookings ADD COLUMN promoted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_bookings' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE class_bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Function to check if a class is full
CREATE OR REPLACE FUNCTION is_class_full(class_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  class_capacity INT;
  confirmed_count INT;
BEGIN
  SELECT capacity INTO class_capacity
  FROM classes
  WHERE id = class_id_param;
  
  SELECT COUNT(*) INTO confirmed_count
  FROM class_bookings
  WHERE class_id = class_id_param
  AND status IN ('booked', 'confirmed');
  
  RETURN confirmed_count >= COALESCE(class_capacity, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to automatically set booking status based on capacity
CREATE OR REPLACE FUNCTION set_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  class_capacity INT;
  confirmed_count INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT capacity INTO class_capacity
    FROM classes
    WHERE id = NEW.class_id;
    
    SELECT COUNT(*) INTO confirmed_count
    FROM class_bookings
    WHERE class_id = NEW.class_id
    AND status IN ('booked', 'confirmed')
    AND id != NEW.id;
    
    IF confirmed_count >= COALESCE(class_capacity, 20) THEN
      NEW.status := 'waitlisted';
    ELSIF NEW.status IS NULL OR NEW.status = '' THEN
      NEW.status := 'booked';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to automatically set booking status
DROP TRIGGER IF EXISTS set_booking_status_trigger ON class_bookings;
CREATE TRIGGER set_booking_status_trigger
  BEFORE INSERT ON class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_status();

-- Function to promote waitlisted bookings when a spot opens
CREATE OR REPLACE FUNCTION promote_waitlisted_booking()
RETURNS TRIGGER AS $$
DECLARE
  next_booking_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND 
     NEW.status = 'cancelled' AND 
     OLD.status IN ('booked', 'confirmed') THEN
    
    SELECT id INTO next_booking_id
    FROM class_bookings
    WHERE class_id = NEW.class_id
    AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF next_booking_id IS NOT NULL THEN
      UPDATE class_bookings
      SET status = 'booked',
          promoted_at = NOW()
      WHERE id = next_booking_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to promote waitlisted bookings
DROP TRIGGER IF EXISTS promote_waitlisted_trigger ON class_bookings;
CREATE TRIGGER promote_waitlisted_trigger
  AFTER UPDATE ON class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION promote_waitlisted_booking();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_class_bookings_member_class 
  ON class_bookings(member_id, class_id);

CREATE INDEX IF NOT EXISTS idx_class_bookings_class_status 
  ON class_bookings(class_id, status);

CREATE INDEX IF NOT EXISTS idx_class_bookings_waitlist_order 
  ON class_bookings(class_id, created_at) 
  WHERE status = 'waitlisted';

-- Unique constraint to prevent duplicate active bookings
DROP INDEX IF EXISTS unique_active_booking_per_member_class;
CREATE UNIQUE INDEX unique_active_booking_per_member_class
ON class_bookings (member_id, class_id)
WHERE status IN ('booked', 'confirmed', 'waitlisted');