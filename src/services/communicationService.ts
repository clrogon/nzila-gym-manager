import { supabase } from '@/integrations/supabase/client';
import type { StaffMessage, WhatsAppMessage, SendStaffMessageParams, SendWhatsAppMessageParams } from '@/types/communications';

export async function getStaffMessages(conversationUserId?: string) {
  let query = supabase
    .from('staff_messages')
    .select(`
      *,
      sender:auth.users!sender_id(id, email, user_metadata),
      recipient:auth.users!recipient_id(id, email, user_metadata)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (conversationUserId) {
    query = query.or(`sender_id.eq.${conversationUserId},recipient_id.eq.${conversationUserId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as StaffMessage[];
}

export async function sendStaffMessage(params: SendStaffMessageParams) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) throw new Error('User not authenticated');

  const { data: gymData } = await supabase
    .from('user_gyms')
    .select('gym_id')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .single();

  if (!gymData?.gym_id) throw new Error('No active gym found');

  const { data, error } = await supabase
    .from('staff_messages')
    .insert({
      gym_id: gymData.gym_id,
      sender_id: userData.user.id,
      recipient_id: params.recipient_id,
      message: params.message,
    })
    .select(`
      *,
      sender:auth.users!sender_id(id, email, user_metadata)
    `)
    .single();

  if (error) throw error;
  return data as StaffMessage;
}

export async function markStaffMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from('staff_messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMessage;
}

export async function getUnreadCount() {
  const { data, error } = await supabase
    .from('staff_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', supabase.auth.getUser().then(u => u.data.user?.id))
    .eq('is_read', false);

  if (error) throw error;
  return data?.length || 0;
}

export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) throw new Error('User not authenticated');

  const { data: gymData } = await supabase
    .from('user_gyms')
    .select('gym_id')
    .eq('user_id', userData.user.id)
    .eq('is_active', true)
    .single();

  if (!gymData?.gym_id) throw new Error('No active gym found');

  let phoneNumber = params.phone_number;
  if (params.member_id) {
    const { data: memberData } = await supabase
      .from('members')
      .select('phone')
      .eq('id', params.member_id)
      .single();
    if (memberData) phoneNumber = memberData.phone;
  }

  if (!phoneNumber) throw new Error('No phone number provided');

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      gym_id: gymData.gym_id,
      sent_by: userData.user.id,
      member_id: params.member_id || null,
      phone_number: phoneNumber,
      message: params.message,
      template_name: params.template_name || null,
      status: 'pending',
    })
    .select(`
      *,
      sent_by_user:auth.users!sent_by(id, email, user_metadata),
      member:members!member_id(id, full_name, phone)
    `)
    .single();

  if (error) throw error;

  const whatsappData = data as WhatsAppMessage;

  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        message: params.message,
      }),
    });

    if (response.ok) {
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', whatsappData.id);
    } else {
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          error_message: 'Failed to send',
        })
        .eq('id', whatsappData.id);
    }
  } catch (err) {
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', whatsappData.id);
  }

  return whatsappData;
}

export async function getWhatsAppHistory(memberId?: string) {
  let query = supabase
    .from('whatsapp_messages')
    .select(`
      *,
      sent_by_user:auth.users!sent_by(id, email, user_metadata),
      member:members!member_id(id, full_name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (memberId) {
    query = query.eq('member_id', memberId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as WhatsAppMessage[];
}
