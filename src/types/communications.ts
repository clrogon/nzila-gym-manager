export interface StaffMessage {
  id: string;
  gym_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  recipient?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface WhatsAppMessage {
  id: string;
  gym_id: string;
  sent_by: string;
  member_id: string | null;
  phone_number: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  template_name: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  sent_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  member?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

export interface SendStaffMessageParams {
  recipient_id: string;
  message: string;
}

export interface SendWhatsAppMessageParams {
  member_id?: string;
  phone_number?: string;
  message: string;
  template_name?: string;
}
