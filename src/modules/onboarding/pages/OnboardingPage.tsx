import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GymSetupWizard } from '../components/GymSetupWizard';
import { UnauthorizedAccess } from '../components/UnauthorizedAccess';
import { ModuleLoader } from '@/components/common/ModuleLoader';

export function OnboardingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canCreateGym, setCanCreateGym] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has gym_owner or super_admin role
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['gym_owner', 'super_admin']);

        if (error) throw error;

        setCanCreateGym(roles && roles.length > 0);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanCreateGym(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user]);

  if (loading) {
    return <ModuleLoader message="Checking permissions..." />;
  }

  if (!canCreateGym) {
    return <UnauthorizedAccess />;
  }

  return <GymSetupWizard />;
}
