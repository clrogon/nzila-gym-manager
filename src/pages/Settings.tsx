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

export default function Settings() {
  const { currentGym, refreshGyms } = useGym();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [welcomeEmails, setWelcomeEmails] = useState(true);
  const [reminderDays, setReminderDays] = useState('7');

  useEffect(() => {
    if (currentGym) fetchPlans();
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
            <TabsTrigger value="general">
              <Building2 className="w-4 h-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="plans">
              <CreditCard className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Link2 className="w-4 h-4 mr-2" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
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
              }}
              onChange={{
                setEmailNotifications,
                setSmsNotifications,
                setMembershipReminders,
                setPaymentReminders,
                setWelcomeEmails,
                setReminderDays,
              }}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <SettingsIntegrations />
          </TabsContent>

          <TabsContent value="security">
            <SettingsSecurity />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
