import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures that the current user has access to the specified gym.
 * This is a client-side check to complement the database-level RLS.
 */
export const validateTenantAccess = async (gymId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('gym_id', gymId)
    .maybeSingle();

  if (error || !data) {
    // Check if user is super_admin
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .is('gym_id', null)
      .maybeSingle();
    
    return !!superAdminData;
  }

  return true;
};

/**
 * Logs an administrative action to the platform audit logs.
 */
export const logPlatformAction = async (
  action: string,
  entityType: string,
  entityId?: string,
  oldData?: any,
  newData?: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('platform_audit_logs' as any).insert([{
      user_id: user?.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
      user_agent: navigator.userAgent,
    }]);
  } catch (error) {
    console.error('Failed to log platform action:', error);
  }
};
