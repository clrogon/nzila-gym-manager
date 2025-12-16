import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Check } from 'lucide-react';

export default function SettingsIntegrations() {
  const [multicaixaEnabled, setMulticaixaEnabled] = useState(false);
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

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
                onClick={() => setMulticaixaEnabled(!multicaixaEnabled)}
              >
                {multicaixaEnabled ? 'Configurar' : 'Conectar'}
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
            <Button variant="outline" size="sm" disabled>
              Em Breve
            </Button>
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
            <Button variant="outline" size="sm" disabled>
              Em Breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
