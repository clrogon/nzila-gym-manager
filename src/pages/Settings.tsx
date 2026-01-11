import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Bell, Link2, Shield, MapPin, Sparkles } from 'lucide-react';

import SettingsGeneral from './settings/SettingsGeneral';
import SettingsPlans from './settings/SettingsPlans';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsIntegrations from './settings/SettingsIntegrations';
import SettingsSecurity from './settings/SettingsSecurity';
import SettingsLocations from './settings/SettingsLocations';

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
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!currentGym) return;
    fetchPlans();
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
          <div className="glass-card p-8 rounded-2xl text-center animate-fade-in">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p className="text-muted-foreground font-medium">
              Por favor, selecione um ginásio primeiro.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabItems = [
    { value: 'general', icon: Building2, label: 'Geral' },
    { value: 'plans', icon: CreditCard, label: 'Planos' },
    { value: 'locations', icon: MapPin, label: 'Locais' },
    { value: 'notifications', icon: Bell, label: 'Notificações' },
    { value: 'integrations', icon: Link2, label: 'Integrações' },
    { value: 'security', icon: Shield, label: 'Segurança' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-accent/20 border border-border/50 p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 glow-gold">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold font-display tracking-tight">Definições</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Gerir a configuração completa do seu ginásio com controlos avançados
            </p>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="relative">
            <TabsList className="w-full h-auto p-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl grid grid-cols-2 lg:grid-cols-6 gap-1.5">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="group relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:glow-gold hover:bg-muted/50"
                >
                  <tab.icon className="w-4 h-4 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Subtle decorative line */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 divider-gold opacity-50" />
          </div>

          <div className="relative">
            {/* Content wrapper with premium styling */}
            <div className="relative">
              <TabsContent value="general" className="mt-0 animate-fade-in">
                <SettingsGeneral gym={currentGym} refreshGyms={refreshGyms} />
              </TabsContent>

              <TabsContent value="plans" className="mt-0 animate-fade-in">
                <SettingsPlans
                  plans={plans}
                  refresh={fetchPlans}
                  currency={currentGym.currency || 'AOA'}
                  gymId={currentGym.id}
                />
              </TabsContent>

              <TabsContent value="locations" className="mt-0 animate-fade-in">
                <SettingsLocations />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 animate-fade-in">
                <SettingsNotifications />
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 animate-fade-in">
                <SettingsIntegrations />
              </TabsContent>

              <TabsContent value="security" className="mt-0 animate-fade-in">
                <SettingsSecurity />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
