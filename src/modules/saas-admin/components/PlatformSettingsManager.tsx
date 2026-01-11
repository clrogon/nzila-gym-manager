import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Settings2,
  Save,
  RefreshCw,
  Globe,
  Mail,
  CreditCard,
  Shield,
  Palette,
  Bell,
} from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface PlatformSetting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  category: string | null;
}

export default function PlatformSettingsManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state grouped by category
  const [generalSettings, setGeneralSettings] = useState({
    platform_name: 'Nzila Gym Manager',
    support_email: 'support@nzila.com',
    default_currency: 'USD',
    default_timezone: 'UTC',
  });

  const [emailSettings, setEmailSettings] = useState({
    welcome_email_enabled: true,
    payment_reminder_enabled: true,
    marketing_enabled: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    require_2fa_admins: false,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
  });

  const [billingSettings, setBillingSettings] = useState({
    trial_days: 14,
    grace_period_days: 7,
    auto_suspend_past_due: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category');

      if (error) throw error;

      setSettings(data || []);

      // Parse existing settings into state
      data?.forEach((s) => {
        const val = s.value as Record<string, unknown>;
        switch (s.key) {
          case 'general':
            setGeneralSettings((prev) => ({ ...prev, ...val }));
            break;
          case 'email':
            setEmailSettings((prev) => ({ ...prev, ...val }));
            break;
          case 'security':
            setSecuritySettings((prev) => ({ ...prev, ...val }));
            break;
          case 'billing':
            setBillingSettings((prev) => ({ ...prev, ...val }));
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: Record<string, unknown>, description: string, category: string) => {
    setSaving(true);
    try {
      const existing = settings.find((s) => s.key === key);

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: value as Json })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('platform_settings').insert([
          { key, value: value as Json, description, category },
        ]);
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Settings saved' });
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-amber-500" />
          Platform Settings
        </h2>
        <p className="text-muted-foreground">Configure global platform behavior</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Core platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input
                    value={generalSettings.platform_name}
                    onChange={(e) =>
                      setGeneralSettings((p) => ({ ...p, platform_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={generalSettings.support_email}
                    onChange={(e) =>
                      setGeneralSettings((p) => ({ ...p, support_email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input
                    value={generalSettings.default_currency}
                    onChange={(e) =>
                      setGeneralSettings((p) => ({ ...p, default_currency: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Input
                    value={generalSettings.default_timezone}
                    onChange={(e) =>
                      setGeneralSettings((p) => ({ ...p, default_timezone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  saveSetting('general', generalSettings, 'General platform settings', 'general')
                }
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure automated email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Welcome Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Send welcome email to new gym owners
                  </p>
                </div>
                <Switch
                  checked={emailSettings.welcome_email_enabled}
                  onCheckedChange={(c) =>
                    setEmailSettings((p) => ({ ...p, welcome_email_enabled: c }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send payment reminders before due dates
                  </p>
                </div>
                <Switch
                  checked={emailSettings.payment_reminder_enabled}
                  onCheckedChange={(c) =>
                    setEmailSettings((p) => ({ ...p, payment_reminder_enabled: c }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Send promotional and feature update emails
                  </p>
                </div>
                <Switch
                  checked={emailSettings.marketing_enabled}
                  onCheckedChange={(c) =>
                    setEmailSettings((p) => ({ ...p, marketing_enabled: c }))
                  }
                />
              </div>
              <Button
                onClick={() =>
                  saveSetting('email', emailSettings, 'Email notification settings', 'email')
                }
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Configure subscription and billing behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trial Period (days)</Label>
                  <Input
                    type="number"
                    value={billingSettings.trial_days}
                    onChange={(e) =>
                      setBillingSettings((p) => ({ ...p, trial_days: parseInt(e.target.value) || 14 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grace Period (days)</Label>
                  <Input
                    type="number"
                    value={billingSettings.grace_period_days}
                    onChange={(e) =>
                      setBillingSettings((p) => ({
                        ...p,
                        grace_period_days: parseInt(e.target.value) || 7,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-suspend Past Due</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically suspend gyms after grace period
                  </p>
                </div>
                <Switch
                  checked={billingSettings.auto_suspend_past_due}
                  onCheckedChange={(c) =>
                    setBillingSettings((p) => ({ ...p, auto_suspend_past_due: c }))
                  }
                />
              </div>
              <Button
                onClick={() =>
                  saveSetting('billing', billingSettings, 'Billing and subscription settings', 'billing')
                }
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Billing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure platform security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require 2FA for Admins</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce two-factor authentication for admin accounts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.require_2fa_admins}
                  onCheckedChange={(c) =>
                    setSecuritySettings((p) => ({ ...p, require_2fa_admins: c }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.session_timeout_minutes}
                    onChange={(e) =>
                      setSecuritySettings((p) => ({
                        ...p,
                        session_timeout_minutes: parseInt(e.target.value) || 60,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) =>
                      setSecuritySettings((p) => ({
                        ...p,
                        max_login_attempts: parseInt(e.target.value) || 5,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  saveSetting('security', securitySettings, 'Security configuration', 'security')
                }
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
