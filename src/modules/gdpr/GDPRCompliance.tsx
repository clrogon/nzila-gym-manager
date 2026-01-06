import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { Users, Lock, Calendar, Shield, Key } from 'lucide-react';

import GDPRCompliance from '@/modules/gdpr/GDPRCompliance';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';

import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';

interface Gym {
  name: string;
  id: string;
}

interface SettingsSecurityProps {
  gym?: Gym;
}

export default function SettingsSecurity({ gym }: SettingsSecurityProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { currentGym } = useGym();
  const { user } = useAuth();

  const [currentMember, setCurrentMember] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // Placeholder static data (replace with real queries later)
  const lastSettingsChange = new Date('2025-12-01T10:30:00');
  const adminCount = 3;

  /**
   * Fetch current member for GDPR scoping
   * Member-level scoping is REQUIRED for GDPR correctness
   */
  useEffect(() => {
    let mounted = true;

    if (!user || !currentGym) {
      setCurrentMember(null);
      return;
    }

    setMemberLoading(true);

    supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .eq('gym_id', currentGym.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error('[GDPR] Failed to resolve member', error);
          setCurrentMember(null);
          return;
        }

        if (data) {
          setCurrentMember(data.id);
        }
      })
      .finally(() => {
        if (mounted) setMemberLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, currentGym]);

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

        {/* =========================
            OVERVIEW TAB
           ========================= */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança & Auditoria</CardTitle>
              <CardDescription>
                Consulte o histórico e controle os acessos da sua conta.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <p>
                  Autenticação segura com validação de senha e proteção contra
                  ataques de força bruta.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <p>
                  Última alteração de definições:{' '}
                  <strong>{lastSettingsChange.toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <p>
                  Administradores com acesso completo:{' '}
                  <strong>{adminCount}</strong>
                </p>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">
                  Funcionalidades de Segurança Ativas:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Limitação de tentativas de login (5 tentativas/minuto)</li>
                  <li>✓ Validação de força de senha no registo</li>
                  <li>✓ Sessões com expiração automática</li>
                  <li>✓ Registo de eventos de autenticação</li>
                  <li>✓ Proteção contra injeção SQL</li>
                </ul>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================
            GDPR TAB
           ========================= */}
        <TabsContent value="gdpr" className="mt-4">
          {memberLoading && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                A carregar definições de privacidade…
              </CardContent>
            </Card>
          )}

          {!memberLoading && currentMember && (
            <GDPRCompliance memberId={currentMember} />
          )}

          {!memberLoading && !currentMember && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Não foi possível determinar o membro atual para gestão de GDPR.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
