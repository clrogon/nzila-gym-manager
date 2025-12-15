import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Bell, Link2 } from 'lucide-react';

import { useGym } from '@/contexts/GymContext';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';

import SettingsGeneral from './settings/SettingsGeneral';
import SettingsPlans, { MembershipPlan } from './settings/SettingsPlans';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsIntegrations from './settings/SettingsIntegrations';

export default function Settings() {
  const { currentGym, refreshGyms } = useGym();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // ─── Gym settings ─────────────────────────────────────
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('Africa/Luanda');
  const [currency, setCurrency] = useState('AOA');
  const [logoUrl, setLogoUrl] = useState('');

  // ─── Notifications ────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [welcomeEmails, setWelcomeEmails] = useState(true);
  const [reminderDays, setReminderDays] = useState('7');

  useEffect(() => {
    if (!currentGym) return;

    setGymName(currentGym.name);
    setPhone(currentGym.phone || '');
    setAddress(currentGym.address || '');
    setEmail(currentGym.email || '');
    setTimezone(currentGym.timezone || 'Africa/Luanda');
    setCurrency(currentGym.currency || 'AOA');
    setLogoUrl(currentGym.logo_url || '');

    fetchPlans();
  }, [currentGym]);

  const fetchPlans = async () => {
    if (!currentGym) return;
    const { data } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('gym_id', currentGym.id)
      .order('price');

    setPlans(data || []);
  };

  const saveGymSettings = async () => {
    if (!currentGym) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          name: gymName,
          phone,
          address,
          email,
          timezone,
          currency,
          logo_url: logoUrl || null,
        })
        .eq('id', currentGym.id);

      if (error) throw error;

      await refreshGyms();
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your gym configuration</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" />General</TabsTrigger>
            <TabsTrigger value="plans"><CreditCard className="w-4 h-4 mr-2" />Plans</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="w-4 h-4 mr-2" />Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsGeneral
              loading={loading}
              gymName={gymName}
              phone={phone}
              address={address}
              email={email}
              timezone={timezone}
              currency={currency}
              logoUrl={logoUrl}
              onChange={{
                setGymName,
                setPhone,
                setAddress,
                setEmail,
                setTimezone,
                setCurrency,
                setLogoUrl,
              }}
              onSave={saveGymSettings}
            />
          </TabsContent>

          <TabsContent value="plans">
            <SettingsPlans
              plans={plans}
              refresh={fetchPlans}
              currency={currency}
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
              }}
              onChange={{
                setEmailNotifications,
                setSmsNotifications,
                setMembershipReminders,
                setPaymentReminders,
                setWelcomeEmails,
                setReminderDays,
              }}
              canSave={hasPermission('settings:update')}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <SettingsIntegrations />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
