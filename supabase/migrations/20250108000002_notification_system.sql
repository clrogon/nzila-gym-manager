-- ============================================================================
-- NOTIFICATION SYSTEM MIGRATION
-- Migration: 20250108000002_notification_system.sql
-- ============================================================================
-- This migration adds tables and functions for automated notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_gym_id ON public.notifications(gym_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff can view gym notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Staff can view notifications sent to gym members
CREATE POLICY "Staff can view gym notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = notifications.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'manager', 'staff', 'receptionist')
  )
);

-- Only system (service_role) can create notifications
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'service_role'
);

-- Comment on table
COMMENT ON TABLE public.notifications IS 'Stores notifications for members including booking confirmations, payment reminders, and class cancellations.';

COMMENT ON COLUMN public.notifications.type IS 'Notification type: booking_confirmation, payment_reminder, class_cancellation, payment_overdue, membership_expiry, etc.';

COMMENT ON COLUMN public.notifications.status IS 'Notification status: pending, sent, failed, delivered.';

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_templates_gym_id ON public.notification_templates(gym_id);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(type);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view own gym templates" ON public.notification_templates;

CREATE POLICY "Staff can view own gym templates"
ON public.notification_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.gym_id = notification_templates.gym_id
      AND ur.role IN ('gym_owner', 'admin', 'manager')
  )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create booking confirmation notification
CREATE OR REPLACE FUNCTION public.create_booking_notification(
  p_booking_id UUID,
  p_gym_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_member RECORD;
  v_class RECORD;
  v_notification_id UUID;
BEGIN
  -- Get booking details
  SELECT
    cb.*,
    m.id AS member_id,
    m.user_id,
    c.name AS class_name,
    c.start_time,
    c.location
  INTO v_booking
  FROM public.class_bookings cb
  INNER JOIN public.members m ON cb.member_id = m.id
  INNER JOIN public.classes c ON cb.class_id = c.id
  WHERE cb.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Create notification
  INSERT INTO public.notifications (
    gym_id,
    user_id,
    member_id,
    type,
    title,
    message,
    metadata,
    status,
    scheduled_for
  )
  VALUES (
    p_gym_id,
    v_booking.user_id,
    v_booking.member_id,
    'booking_confirmation',
    'Class Booking Confirmed!',
    format('Your booking for %s at %s on %s has been confirmed.',
      v_booking.class_name,
      v_booking.location,
      to_char(v_booking.start_time, 'DD/MM/YYYY at HH24:MI')
    ),
    jsonb_build_object(
      'booking_id', p_booking_id,
      'class_name', v_booking.class_name,
      'start_time', v_booking.start_time,
      'location', v_booking.location
    ),
    'pending',
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking_notification TO authenticated;

-- Function to create payment reminder notification
CREATE OR REPLACE FUNCTION public.create_payment_reminder(
  p_member_id UUID,
  p_gym_id UUID,
  p_days_until_due INTEGER DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_plan RECORD;
  v_notification_id UUID;
BEGIN
  -- Get member and plan details
  SELECT
    m.*,
    mp.id AS membership_plan_id,
    mp.name AS plan_name,
    mp.price
  INTO v_member
  FROM public.members m
  INNER JOIN public.membership_plans mp ON m.plan_id = mp.id
  WHERE m.id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Create notification
  INSERT INTO public.notifications (
    gym_id,
    user_id,
    member_id,
    type,
    title,
    message,
    metadata,
    status,
    scheduled_for
  )
  VALUES (
    p_gym_id,
    v_member.user_id,
    p_member_id,
    'payment_reminder',
    'Payment Reminder',
    format('Your %s plan payment is due in %d days. Amount: %s Kz.',
      v_member.plan_name,
      p_days_until_due,
      v_member.price
    ),
    jsonb_build_object(
      'member_id', p_member_id,
      'plan_name', v_member.plan_name,
      'amount', v_member.price,
      'due_date', v_member.membership_end_date
    ),
    'pending',
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_payment_reminder TO authenticated;

-- Function to create class cancellation notification
CREATE OR REPLACE FUNCTION public.create_class_cancellation_notification(
  p_booking_id UUID,
  p_class_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Get all affected bookings
  INSERT INTO public.notifications (
    gym_id,
    user_id,
    member_id,
    type,
    title,
    message,
    metadata,
    status,
    scheduled_for
  )
  SELECT
    cb.gym_id,
    m.user_id,
    cb.member_id,
    'class_cancellation',
    'Class Cancelled',
    format('Your scheduled class has been cancelled. Reason: %s', p_reason),
    jsonb_build_object(
      'booking_id', cb.id,
      'class_id', p_class_id,
      'reason', p_reason
    ),
    'pending',
    NOW()
  FROM public.class_bookings cb
  INNER JOIN public.members m ON cb.member_id = m.id
  WHERE cb.class_id = p_class_id
    AND cb.status = 'confirmed'
    AND cb.start_time > NOW();

  -- Return first notification ID (or NULL)
  SELECT id INTO v_notification_id
  FROM public.notifications
  WHERE type = 'class_cancellation'
    AND metadata @> jsonb_build_object('class_id', p_class_id)
  LIMIT 1;

  RETURN COALESCE(v_notification_id, gen_random_uuid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_class_cancellation_notification TO authenticated;

-- Function to send pending notifications
CREATE OR REPLACE FUNCTION public.send_pending_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification RECORD;
  v_sent_count INTEGER := 0;
BEGIN
  -- Get all pending notifications scheduled for now
  FOR v_notification IN
    SELECT * FROM public.notifications
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
    FOR UPDATE
  LOOP
    -- In production, this would call the email service
    -- For now, mark as sent
    UPDATE public.notifications
    SET status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = v_notification.id;

    v_sent_count := v_sent_count + 1;
  END LOOP;

  RETURN v_sent_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_pending_notifications TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Create Edge Function to process pending notifications
-- 2. Schedule cron job to call send_pending_notifications
-- 3. Integrate with booking system to trigger notifications
-- 4. Integrate with payment system to trigger reminders
-- 5. Add notification preferences in member settings
