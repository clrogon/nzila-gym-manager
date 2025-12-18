import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Bell, Link2, Shield } from 'lucide-react';

import SettingsGeneral from './settings/SettingsGeneral';
import SettingsPlans from './settings/SettingsPlans';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsIntegrations from './settings/SettingsIntegrations';
import SettingsSecurity from './settings/SettingsSecurity';

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
}

interface NotificationSettings {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  membership_reminders?: boolean;
  payment_reminders?: boolean;
  welcome_emails?: boolean;
  reminder_days?: number;
  locale?: string;
}

export default function Settings() {
  const { currentGym, refreshGyms } = useGym();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!currentGym) return;
    fetchPlans();
    loadNotificationSettings();
    setTimezone(currentGym.timezone || 'Africa/Luanda');
  }, [currentGym]);

  const fetchPlans = async () => {
    if (!currentGym) return;
    setLoading(true);
    const { data } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('gym_id', currentGym.id)
      .order('price');

    setPlans(data || []);
    setLoading(false);
  };

  const loadNotificationSettings = async () => {
    if (!currentGym) return;

    // Load from gym's settings JSON field
    const settings = currentGym.settings as NotificationSettings | null;
    if (!settings) return;

    if (settings.email_notifications !== undefined) setEmailNotifications(settings.email_notifications);
    if (settings.sms_notifications !== undefined) setSmsNotifications(settings.sms_notifications);
    if (settings.membership_reminders !== undefined) setMembershipReminders(settings.membership_reminders);
    if (settings.payment_reminders !== undefined) setPaymentReminders(settings.payment_reminders);
    if (settings.welcome_emails !== undefined) setWelcomeEmails(settings.welcome_emails);
    if (settings.reminder_days !== undefined) setReminderDays(String(settings.reminder_days));
    if (settings.locale !== undefined) setLocale(settings.locale);
  };

  const persistNotifications = async () => {
    if (!currentGym) return;

    const currentSettings = (currentGym.settings as NotificationSettings) || {};
    const newSettings = {
      ...currentSettings,
      email_notifications: emailNotifications,
      sms_notifications: smsNotifications,
      membership_reminders: membershipReminders,
      payment_reminders: paymentReminders,
      welcome_emails: welcomeEmails,
      reminder_days: parseInt(reminderDays),
      locale,
    };

    await supabase
      .from('gyms')
      .update({ settings: newSettings, timezone })
      .eq('id', currentGym.id);
  };

  useEffect(() => {
    if (!currentGym) return;
    const timeout = setTimeout(() => {
      persistNotifications();
    }, 500); // Debounce to avoid too many updates
    return () => clearTimeout(timeout);
  }, [
    emailNotifications,
    smsNotifications,
    membershipReminders,
    paymentReminders,
    welcomeEmails,
    reminderDays,
    timezone,
    locale,
  ]);

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Por favor, selecione um ginásio primeiro.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Definições</h1>
          <p className="text-muted-foreground">
            Gerir a configuração do ginásio
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" />Geral</TabsTrigger>
            <TabsTrigger value="plans"><CreditCard className="w-4 h-4 mr-2" />Planos</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notificações</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="w-4 h-4 mr-2" />Integrações</TabsTrigger>
            <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsGeneral gym={currentGym} refreshGyms={refreshGyms} />
          </TabsContent>

          <TabsContent value="plans">
            <SettingsPlans
              plans={plans}
              refresh={fetchPlans}
              currency={currentGym.currency || 'AOA'}
              gymId={currentGym.id}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <SettingsNotifications
              state={{
                emailNotifications,
                smsNotifications,
                membershipReminders,
                paymentReminders,
                welcomeEmails,
                reminderDays,
                timezone,
                locale,
              }}
              onChange={{
                setEmailNotifications,
                setSmsNotifications,
                setMembershipReminders,
                setPaymentReminders,
                setWelcomeEmails,
                setReminderDays,
                setTimezone,
                setLocale,
              }}
            />
          </TabsContent>

          <TabsContent value="integrations"><SettingsIntegrations /></TabsContent>
          <TabsContent value="security"><SettingsSecurity /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
