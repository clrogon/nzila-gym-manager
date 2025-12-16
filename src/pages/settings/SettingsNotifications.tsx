import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RequirePermission } from '@/components/common/RequirePermission';
import { Save, Mail, MessageSquare, Clock } from 'lucide-react';

interface NotificationState {
  emailNotifications: boolean;
  smsNotifications: boolean;
  membershipReminders: boolean;
  paymentReminders: boolean;
  welcomeEmails: boolean;
  reminderDays: string;
  timezone: string;
  locale: string;
}

interface NotificationOnChange {
  setEmailNotifications: (value: boolean) => void;
  setSmsNotifications: (value: boolean) => void;
  setMembershipReminders: (value: boolean) => void;
  setPaymentReminders: (value: boolean) => void;
  setWelcomeEmails: (value: boolean) => void;
  setReminderDays: (value: string) => void;
  setTimezone: (value: string) => void;
  setLocale: (value: string) => void;
}

interface SettingsNotificationsProps {
  state: NotificationState;
  onChange: NotificationOnChange;
}

export default function SettingsNotifications({ state, onChange }: SettingsNotificationsProps) {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ 
      title: 'Definições de Notificação Guardadas', 
      description: 'As suas preferências foram atualizadas.' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>Configure como deseja contactar os seus membros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Enviar notificações por email</p>
              </div>
            </div>
            <Switch 
              checked={state.emailNotifications} 
              onCheckedChange={onChange.setEmailNotifications} 
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Notificações por SMS</p>
                <p className="text-sm text-muted-foreground">Enviar mensagens de texto aos membros</p>
              </div>
            </div>
            <Switch 
              checked={state.smsNotifications} 
              onCheckedChange={onChange.setSmsNotifications} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Automatic Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Automáticas</CardTitle>
          <CardDescription>Configure notificações automáticas para os seus membros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mensagens de Boas-vindas</p>
              <p className="text-sm text-muted-foreground">Enviar email de boas-vindas a novos membros</p>
            </div>
            <Switch 
              checked={state.welcomeEmails} 
              onCheckedChange={onChange.setWelcomeEmails} 
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de Expiração de Subscrição</p>
              <p className="text-sm text-muted-foreground">Notificar membros antes da expiração da subscrição</p>
            </div>
            <Switch 
              checked={state.membershipReminders} 
              onCheckedChange={onChange.setMembershipReminders} 
            />
          </div>

          {state.membershipReminders && (
            <div className="ml-6 space-y-2">
              <Label>Dias antes da expiração</Label>
              <Select 
                value={state.reminderDays} 
                onValueChange={onChange.setReminderDays}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de Pagamento</p>
              <p className="text-sm text-muted-foreground">Enviar lembretes para pagamentos pendentes</p>
            </div>
            <Switch 
              checked={state.paymentReminders} 
              onCheckedChange={onChange.setPaymentReminders} 
            />
          </div>

          <Separator />

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Regionais</CardTitle>
              <CardDescription>Defina fuso horário e formato de data/hora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={state.timezone} onValueChange={onChange.setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Luanda">Africa/Luanda (WAT)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                    <SelectItem value="Europe/Lisbon">Europe/Lisbon (WET)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Locale</Label>
                <Select value={state.locale} onValueChange={onChange.setLocale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-PT">pt-PT</SelectItem>
                    <SelectItem value="en-US">en-US</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <RequirePermission permission="settings:update">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Definições de Notificação
            </Button>
          </RequirePermission>
        </CardContent>
      </Card>
    </div>
  );
}
