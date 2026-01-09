import { supabase } from '@/integrations/supabase/client';
import type { StaffMessage, WhatsAppMessage, SendStaffMessageParams, SendWhatsAppMessageParams } from '@/types/communications';

/**
 * Get staff messages, optionally filtered by conversation user
 */
export async function getStaffMessages(conversationUserId?: string): Promise<StaffMessage[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return [];

  let query = supabase
    .from('staff_messages' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (conversationUserId) {
    query = query.or(`sender_id.eq.${conversationUserId},recipient_id.eq.${conversationUserId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as StaffMessage[];
}

/**
 * Get current user's active gym ID from user_roles
 */
async function getCurrentGymId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_roles')
    .select('gym_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  
  return data?.gym_id || null;
}

/**
 * Send a staff message
 */
export async function sendStaffMessage(params: SendStaffMessageParams): Promise<StaffMessage> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) throw new Error('User not authenticated');

  const gymId = await getCurrentGymId(userData.user.id);
  if (!gymId) throw new Error('No active gym found');

  const { data, error } = await supabase
    .from('staff_messages' as any)
    .insert({
      gym_id: gymId,
      sender_id: userData.user.id,
      recipient_id: params.recipient_id,
      message: params.message,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as unknown as StaffMessage;
}

/**
 * Mark a staff message as read
 */
export async function markStaffMessageAsRead(messageId: string): Promise<StaffMessage> {
  const { data, error } = await supabase
    .from('staff_messages' as any)
    .update({ is_read: true })
    .eq('id', messageId)
    .select('*')
    .single();

  if (error) throw error;
  return data as unknown as StaffMessage;
}

/**
 * Get unread message count for current user
 */
export async function getUnreadCount(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return 0;

  const { count, error } = await supabase
    .from('staff_messages' as any)
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userData.user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<WhatsAppMessage> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) throw new Error('User not authenticated');

  const gymId = await getCurrentGymId(userData.user.id);
  if (!gymId) throw new Error('No active gym found');

  let phoneNumber = params.phone_number;
  if (params.member_id) {
    const { data: memberData } = await supabase
      .from('members')
      .select('phone')
      .eq('id', params.member_id)
      .single();
    if (memberData) phoneNumber = memberData.phone || undefined;
  }

  if (!phoneNumber) throw new Error('No phone number provided');

  const { data, error } = await supabase
    .from('whatsapp_messages' as any)
    .insert({
      gym_id: gymId,
      sent_by: userData.user.id,
      member_id: params.member_id || null,
      phone_number: phoneNumber,
      message: params.message,
      template_name: params.template_name || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;

  const whatsappData = data as unknown as WhatsAppMessage;

  // Attempt to send via WhatsApp API (placeholder)
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        message: params.message,
      }),
    });

    const updatePayload = response.ok 
      ? { status: 'sent', sent_at: new Date().toISOString() }
      : { status: 'failed', error_message: 'Failed to send' };

    await supabase
      .from('whatsapp_messages' as any)
      .update(updatePayload)
      .eq('id', whatsappData.id);
  } catch (err) {
    await supabase
      .from('whatsapp_messages' as any)
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', whatsappData.id);
  }

  return whatsappData;
}

/**
 * Get WhatsApp message history
 */
export async function getWhatsAppHistory(memberId?: string): Promise<WhatsAppMessage[]> {
  let query = supabase
    .from('whatsapp_messages' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (memberId) {
    query = query.eq('member_id', memberId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as WhatsAppMessage[];
}
