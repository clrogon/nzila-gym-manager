import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  Mail, 
  MessageSquare, 
  Loader2, 
  Bell, 
  Clock, 
  Globe,
  Sparkles,
  RotateCcw
} from 'lucide-react';

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

  const SectionCard = ({ 
    children, 
    icon: Icon, 
    title, 
    description 
  }: { 
    children: React.ReactNode; 
    icon: React.ElementType; 
    title: string; 
    description: string;
  }) => (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg hover:shadow-xl transition-all duration-500 group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-gold transition-all duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display">{title}</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {children}
      </CardContent>
    </Card>
  );

  const NotificationToggle = ({
    icon: Icon,
    iconColor,
    title,
    description,
    checked,
    onCheckedChange,
  }: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={(value) => { 
          onCheckedChange(value);
          markChanged();
        }}
        disabled={!canEdit}
        className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <SectionCard
        icon={Bell}
        title="Canais de Notificação"
        description="Configure como deseja contactar os seus membros"
      >
        <div className="space-y-4">
          <NotificationToggle
            icon={Mail}
            iconColor="bg-blue-500/10 text-blue-500"
            title="Notificações por Email"
            description="Enviar notificações por email"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />

          <NotificationToggle
            icon={MessageSquare}
            iconColor="bg-green-500/10 text-green-500"
            title="Notificações por SMS"
            description="Enviar mensagens de texto aos membros"
            checked={smsNotifications}
            onCheckedChange={setSmsNotifications}
          />
        </div>
      </SectionCard>

      {/* Automatic Messages */}
      <SectionCard
        icon={Clock}
        title="Mensagens Automáticas"
        description="Configure notificações automáticas para os seus membros"
      >
        <div className="space-y-4">
          <NotificationToggle
            icon={Sparkles}
            iconColor="bg-purple-500/10 text-purple-500"
            title="Mensagens de Boas-vindas"
            description="Enviar email de boas-vindas a novos membros"
            checked={welcomeEmails}
            onCheckedChange={setWelcomeEmails}
          />

          <div className="space-y-3">
            <NotificationToggle
              icon={Bell}
              iconColor="bg-orange-500/10 text-orange-500"
              title="Lembretes de Expiração"
              description="Notificar membros antes da expiração da subscrição"
              checked={membershipReminders}
              onCheckedChange={setMembershipReminders}
            />

            {membershipReminders && (
              <div className="ml-16 p-4 rounded-xl bg-muted/30 border border-border/20 animate-fade-in">
                <Label className="text-sm font-medium mb-2 block">Dias antes da expiração</Label>
                <Select 
                  value={reminderDays} 
                  onValueChange={(value) => {
                    setReminderDays(value);
                    markChanged();
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger className={`w-48 bg-background/50 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}>
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
          </div>

          <NotificationToggle
            icon={Bell}
            iconColor="bg-red-500/10 text-red-500"
            title="Lembretes de Pagamento"
            description="Enviar lembretes para pagamentos pendentes"
            checked={paymentReminders}
            onCheckedChange={setPaymentReminders}
          />
        </div>
      </SectionCard>

      {/* Regional Settings */}
      <SectionCard
        icon={Globe}
        title="Configurações Regionais"
        description="Defina fuso horário e formato de data/hora"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fuso Horário</Label>
            <Select 
              value={timezone} 
              onValueChange={(value) => {
                setTimezone(value);
                markChanged();
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className={`bg-background/50 border-border/50 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}>
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
            <Label className="text-sm font-medium">Locale</Label>
            <Select 
              value={locale} 
              onValueChange={(value) => {
                setLocale(value);
                markChanged();
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className={`bg-background/50 border-border/50 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        {canEdit ? (
          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={loading || !hasChanges}
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:glow-gold transition-all duration-300 font-medium"
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
                className="border-border/50 hover:bg-muted/50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reverter
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
            <Sparkles className="w-4 h-4" />
            Não tem permissão para editar estas definições.
          </div>
        )}
        
        {hasChanges && (
          <span className="text-sm text-primary animate-pulse">
            Alterações não guardadas
          </span>
        )}
      </div>
    </div>
  );
}
