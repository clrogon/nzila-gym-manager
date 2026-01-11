import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Check, Loader2 } from 'lucide-react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/useRBAC';
import type { Json } from '@/integrations/supabase/types';

interface IntegrationSettings {
  multicaixa_enabled?: boolean;
  multicaixa_merchant_id?: string | null;
  [key: string]: Json | undefined;
}

export default function SettingsIntegrations() {
  const { currentGym, refreshGyms } = useGym();
  const { hasPermission } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [multicaixaEnabled, setMulticaixaEnabled] = useState(false);

  const canEdit = hasPermission('settings:update');

  useEffect(() => {
    if (currentGym?.settings && typeof currentGym.settings === 'object') {
      const settings = currentGym.settings as IntegrationSettings;
      setMulticaixaEnabled(settings.multicaixa_enabled ?? false);
    }
  }, [currentGym]);

  const toggleMulticaixa = async () => {
    if (!canEdit) {
      toast.error('Não tem permissão para alterar integrações');
      return;
    }

    if (!currentGym?.id) return;

    setLoading(true);
    try {
      const currentSettings = (typeof currentGym.settings === 'object' && currentGym.settings !== null 
        ? currentGym.settings 
        : {}) as IntegrationSettings;
      const newSettings = {
        ...currentSettings,
        multicaixa_enabled: !multicaixaEnabled,
      } as Json;

      const { error } = await supabase
        .from('gyms')
        .update({ 
          settings: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentGym.id);

      if (error) throw error;

      setMulticaixaEnabled(!multicaixaEnabled);
      await refreshGyms();
      
      toast.success(
        !multicaixaEnabled 
          ? 'Multicaixa Express ativado com sucesso' 
          : 'Multicaixa Express desativado'
      );
    } catch (error) {
      console.error('Error toggling Multicaixa:', error);
      toast.error('Falha ao atualizar integração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações de Pagamento</CardTitle>
          <CardDescription>Conecte fornecedores de pagamento para aceitar pagamentos online</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <span className="font-bold text-orange-500">MC</span>
              </div>
              <div>
                <p className="font-medium">Multicaixa Express</p>
                <p className="text-sm text-muted-foreground">Aceitar pagamentos móveis em Angola</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {multicaixaEnabled && (
                <Badge variant="default" className="gap-1">
                  <Check className="w-3 h-3" />
                  Conectado
                </Badge>
              )}
              <Button 
                variant={multicaixaEnabled ? 'outline' : 'default'} 
                size="sm"
                onClick={toggleMulticaixa}
                disabled={loading || !canEdit}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  multicaixaEnabled ? 'Configurar' : 'Conectar'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outras Integrações</CardTitle>
          <CardDescription>Conecte serviços de terceiros para melhorar o seu ginásio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">Sincronizar aulas e compromissos</p>
              </div>
            </div>
            <Badge variant="outline">Em Breve</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">WhatsApp Business</p>
                <p className="text-sm text-muted-foreground">Enviar notificações via WhatsApp</p>
              </div>
            </div>
            <Badge variant="outline">Em Breve</Badge>
          </div>
        </CardContent>
      </Card>

      {!canEdit && (
        <p className="text-sm text-muted-foreground text-center">
          Não tem permissão para alterar integrações. Contacte um administrador.
        </p>
      )}
    </div>
  );
}
