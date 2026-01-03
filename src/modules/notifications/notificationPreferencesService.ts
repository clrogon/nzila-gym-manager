import { supabase } from "@/integrations/supabase/client";

interface NotificationPreference {
  member_id: string;
  event: string;
  channel: "email" | "push" | "sms";
  enabled: boolean;
}

/**
 * Check if a notification is enabled for a member
 * Uses gym settings as the default if no member-specific preference exists
 */
export async function isNotificationEnabled(
  memberId: string,
  event: string,
  channel: "email" | "push" | "sms"
): Promise<boolean> {
  // For now, return true as default
  // In the future, this can check member-specific preferences
  // stored in a notification_preferences table
  
  try {
    // Get the member's gym settings
    const { data: member } = await supabase
      .from('members')
      .select('gym_id')
      .eq('id', memberId)
      .single();

    if (!member) return true;

    // Get gym notification settings
    const { data: gym } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', member.gym_id)
      .single();

    if (!gym?.settings) return true;

    const settings = gym.settings as Record<string, unknown>;
    
    // Check channel-specific settings
    if (channel === 'email' && settings.emailNotifications === false) {
      return false;
    }
    if (channel === 'sms' && settings.smsNotifications === false) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Update notification preference for a member
 */
export async function setNotificationPreference(
  memberId: string,
  event: string,
  channel: "email" | "push" | "sms",
  enabled: boolean
): Promise<void> {
  // This would update a notification_preferences table
  // For now, we use gym-level settings
  // This is a placeholder for a future feature.
  // In a real implementation, this would update the database.
  if (import.meta.env.DEV) {
    console.log('Setting notification preference:', { memberId, event, channel, enabled });
  }
}
