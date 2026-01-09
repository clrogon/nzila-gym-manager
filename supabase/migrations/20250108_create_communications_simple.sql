-- Simplified Communications Module
-- Internal staff chat + WhatsApp integration for members

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Internal staff messages (simple chat between staff)
CREATE TABLE IF NOT EXISTS staff_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_staff_messages_gym (gym_id),
  INDEX idx_staff_messages_sender (sender_id),
  INDEX idx_staff_messages_recipient (recipient_id),
  INDEX idx_staff_messages_created (created_at DESC)
);

-- WhatsApp messages sent to members
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  template_name TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_whatsapp_gym (gym_id),
  INDEX idx_whatsapp_member (member_id),
  INDEX idx_whatsapp_status (status),
  INDEX idx_whatsapp_created (created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS for staff_messages
CREATE POLICY "Staff can view their sent messages"
  ON staff_messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Staff can view messages sent to them"
  ON staff_messages FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Staff can send messages"
  ON staff_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND gym_id IN (SELECT id FROM gyms WHERE id = current_setting('app.current_gym_id')::UUID)
  );

CREATE POLICY "Staff can mark messages as read"
  ON staff_messages FOR UPDATE
  USING (
    recipient_id = auth.uid()
    AND is_read = FALSE
  );

-- RLS for whatsapp_messages
CREATE POLICY "Staff can view WhatsApp messages from their gym"
  ON whatsapp_messages FOR SELECT
  USING (
    gym_id IN (SELECT id FROM gyms WHERE id = current_setting('app.current_gym_id')::UUID)
  );

CREATE POLICY "Staff can send WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    sent_by = auth.uid()
    AND gym_id IN (SELECT id FROM gyms WHERE id = current_setting('app.current_gym_id')::UUID)
  );

-- Function to get unread staff message count
CREATE OR REPLACE FUNCTION get_unread_staff_message_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM staff_messages
    WHERE recipient_id = auth.uid()
    AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark staff message as read
CREATE OR REPLACE FUNCTION mark_staff_message_as_read(p_message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE staff_messages
  SET is_read = TRUE
  WHERE id = p_message_id
  AND recipient_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for staff_messages
ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages;

-- Add comments
COMMENT ON TABLE staff_messages IS 'Simple direct messages between staff members';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp messages sent to members';
COMMENT ON COLUMN whatsapp_messages.status IS 'pending: queued, sent: sent successfully, delivered: confirmed delivered, failed: error sending';
