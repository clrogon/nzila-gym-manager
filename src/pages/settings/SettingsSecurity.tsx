import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Lock, Calendar, Shield, Key, Loader2, CheckCircle2 } from 'lucide-react';
import GDPRCompliance from '@/modules/gdpr/GDPRCompliance';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityStats {
  adminCount: number;
  lastSettingsChange: string | null;
  lastAuthEvent: string | null;
}

export default function SettingsSecurity() {
  const { currentGym } = useGym();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats>({
    adminCount: 0,
    lastSettingsChange: null,
    lastAuthEvent: null,
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchSecurityStats();
    }
  }, [currentGym?.id]);

  const fetchSecurityStats = async () => {
    if (!currentGym?.id) return;

    setLoading(true);
    try {
      // Get admin count for this gym
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('gym_id', currentGym.id)
        .in('role', ['gym_owner', 'admin', 'manager']);

      if (rolesError) throw rolesError;

      // Get last settings change from audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('gym_id', currentGym.id)
        .eq('entity_type', 'gym')
        .order('created_at', { ascending: false })
        .limit(1);

      if (auditError) throw auditError;

      // Get last auth event
      const { data: authEvents, error: authError } = await supabase
        .from('auth_events')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      // Auth events might fail due to permissions, that's ok
      const lastAuthEvent = authEvents?.[0]?.created_at || null;

      setStats({
        adminCount: roles?.length || 0,
        lastSettingsChange: auditLogs?.[0]?.created_at || null,
        lastAuthEvent,
      });
    } catch (error) {
      console.error('Error fetching security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-PT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Privacidade & GDPR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança & Auditoria</CardTitle>
              <CardDescription>
                Consulte o histórico e controle os acessos da sua conta.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <p>Autenticação segura com validação de senha e proteção contra ataques de força bruta.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <p>
                      Última alteração de definições: <strong>{formatDate(stats.lastSettingsChange)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <p>
                      Administradores com acesso completo: <strong>{stats.adminCount}</strong>
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-3">Funcionalidades de Segurança Ativas:</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Limitação de tentativas de login</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Validação de força de senha</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Sessões com expiração automática</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Registo de eventos de autenticação</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Proteção contra injeção SQL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Row Level Security (RLS)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Alterar Palavra-passe</h4>
                        <p className="text-sm text-muted-foreground">
                          Atualize a sua palavra-passe para maior segurança
                        </p>
                      </div>
                      <ChangePasswordDialog
                        trigger={
                          <Button variant="outline">
                            <Key className="h-4 w-4 mr-2" />
                            Alterar
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="mt-4">
          <GDPRCompliance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
