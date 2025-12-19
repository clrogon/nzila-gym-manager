import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Save, Mail, MessageSquare, Loader2 } from 'lucide-react';

interface NotificationSettings {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  membership_reminders?: boolean;
  payment_reminders?: boolean;
  welcome_emails?: boolean;
  reminder_days?: number;
  locale?: string;
}

export default function SettingsNotifications() {
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const { currentGym, refreshGyms } = useGym();
  
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const canEdit = hasPermission('settings:update');

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [welcomeEmails, setWelcomeEmails] = useState(true);
  const [reminderDays, setReminderDays] = useState('7');
  const [timezone, setTimezone] = useState('Africa/Luanda');
  const [locale, setLocale] = useState('pt-PT');

  useEffect(() => {
    if (currentGym) {
      loadSettings();
    }
  }, [currentGym]);

  const loadSettings = () => {
    if (!currentGym) return;

    // Load from gym's settings JSON field
    const settings = currentGym.settings as NotificationSettings | null;
    
    setTimezone(currentGym.timezone || 'Africa/Luanda');
    
    if (!settings) return;

    if (settings.email_notifications !== undefined) setEmailNotifications(settings.email_notifications);
    if (settings.sms_notifications !== undefined) setSmsNotifications(settings.sms_notifications);
    if (settings.membership_reminders !== undefined) setMembershipReminders(settings.membership_reminders);
    if (settings.payment_reminders !== undefined) setPaymentReminders(settings.payment_reminders);
    if (settings.welcome_emails !== undefined) setWelcomeEmails(settings.welcome_emails);
    if (settings.reminder_days !== undefined) setReminderDays(String(settings.reminder_days));
    if (settings.locale !== undefined) setLocale(settings.locale);
    
    setHasChanges(false);
  };

  const markChanged = () => {
    if (canEdit) setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: 'Acesso Negado',
        description: 'Não tem permissão para editar definições.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentGym) {
      toast({
        title: 'Erro',
        description: 'Ginásio não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    // Validate reminder days
    const days = parseInt(reminderDays, 10);
    if (isNaN(days) || days < 1 || days > 90) {
      toast({
        title: 'Erro de Validação',
        description: 'Dias de lembrete devem estar entre 1 e 90.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const currentSettings = (currentGym.settings as NotificationSettings) || {};
      const newSettings = {
        ...currentSettings,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        membership_reminders: membershipReminders,
        payment_reminders: paymentReminders,
        welcome_emails: welcomeEmails,
        reminder_days: days,
        locale,
      };

      const { error } = await supabase
        .from('gyms')
        .update({ 
          settings: newSettings, 
          timezone,
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentGym.id);

      if (error) throw error;

      await refreshGyms();
      setHasChanges(false);

      toast({ 
        title: 'Definições Guardadas', 
        description: 'As suas preferências de notificação foram atualizadas com sucesso.' 
      });
    } catch (error: any) {
      console.error('Failed to save notification settings:', error?.message);
      toast({ 
        title: 'Erro ao Guardar', 
        description: 'Ocorreu um erro ao guardar. Por favor tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tem a certeza que deseja reverter todas as alterações?')) {
      loadSettings();
    }
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
              checked={emailNotifications} 
              onCheckedChange={(checked) => { 
                setEmailNotifications(checked);
                markChanged();
              }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
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
              checked={smsNotifications} 
              onCheckedChange={(checked) => { 
                setSmsNotifications(checked);
                markChanged();
              }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
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
              checked={welcomeEmails} 
              onCheckedChange={(checked) => { 
                setWelcomeEmails(checked);
                markChanged();
              }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de Expiração de Subscrição</p>
              <p className="text-sm text-muted-foreground">Notificar membros antes da expiração da subscrição</p>
            </div>
            <Switch 
              checked={membershipReminders} 
              onCheckedChange={(checked) => { 
                setMembershipReminders(checked);
                markChanged();
              }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>

          {membershipReminders && (
            <div className="ml-6 space-y-2">
              <Label>Dias antes da expiração</Label>
              <Select 
                value={reminderDays} 
                onValueChange={(value) => {
                  setReminderDays(value);
                  markChanged();
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className={`w-40 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
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
              checked={paymentReminders} 
              onCheckedChange={(checked) => { 
                setPaymentReminders(checked);
                markChanged();
              }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Regionais</CardTitle>
          <CardDescription>Defina fuso horário e formato de data/hora</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select 
              value={timezone} 
              onValueChange={(value) => {
                setTimezone(value);
                markChanged();
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
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
            <Select 
              value={locale} 
              onValueChange={(value) => {
                setLocale(value);
                markChanged();
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canEdit ? (
          <>
            <Button 
              onClick={handleSave} 
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Alterações
                </>
              )}
            </Button>
            {hasChanges && (
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reverter Alterações
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não tem permissão para editar estas definições. Contacte um administrador.
          </p>
        )}
      </div>
    </div>
  );
}
