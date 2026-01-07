import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const [maintenance, setMaintenance] = useState<{
    enabled: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Check if user is super admin (they bypass maintenance)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'super_admin')
            .is('gym_id', null)
            .maybeSingle();
          
          if (roleData) {
            setIsSuperAdmin(true);
            setLoading(false);
            return;
          }
        }

        // Check platform settings
        const { data, error } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (data?.value) {
          setMaintenance(data.value);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  if (loading) return null;

  if (maintenance?.enabled && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground">
            {maintenance.message || 'The system is currently undergoing maintenance. Please check back later.'}
          </p>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Estimated completion: Soon
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
