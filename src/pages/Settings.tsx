import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Bell, Link2 } from 'lucide-react';

import SettingsGeneral from './settings/SettingsGeneral';
import SettingsPlans from './settings/SettingsPlans';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsIntegrations from './settings/SettingsIntegrations';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your gym configuration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general">
              <Building2 className="w-4 h-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="plans">
              <CreditCard className="w-4 h-4 mr-2" /> Plans
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Link2 className="w-4 h-4 mr-2" /> Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsGeneral />
          </TabsContent>

          <TabsContent value="plans">
            <SettingsPlans />
          </TabsContent>

          <TabsContent value="notifications">
            <SettingsNotifications />
          </TabsContent>

          <TabsContent value="integrations">
            <SettingsIntegrations />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
