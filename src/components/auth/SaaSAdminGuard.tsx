import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLoader } from '@/components/common/ModuleLoader';

export const SaaSAdminGuard = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .is('gym_id', null)
          .maybeSingle();

        setIsSuperAdmin(!!data && !error);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSuperAdmin();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <ModuleLoader message="Verifying platform permissions..." />;
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
