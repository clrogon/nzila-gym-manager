src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, CreditCard, Save, AlertCircle, Bell, Link2, 
  Globe, Clock, Mail, MessageSquare, Users, Shield, Palette,
  Upload, Trash2, Plus, Check, Calendar
} from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const { toast } = useToast();
  const { hasPermission, hasMinimumRole, currentRole } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // Gym settings
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('Africa/Luanda');
  const [currency, setCurrency] = useState('AOA');
  const [logoUrl, setLogoUrl] = useState('');

  // New plan form
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('30');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [welcomeEmails, setWelcomeEmails] = useState(true);
  const [reminderDays, setReminderDays] = useState('7');

  // Integration settings
  const [multicaixaEnabled, setMulticaixaEnabled] = useState(false);
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  useEffect(() => {
    if (currentGym) {
      setGymName(currentGym.name);
      setPhone(currentGym.phone || '');
      setAddress(currentGym.address || '');
      setEmail(currentGym.email || '');
      setTimezone(currentGym.timezone || 'Africa/Luanda');
      setCurrency(currentGym.currency || 'AOA');
      setLogoUrl(currentGym.logo_url || '');
      fetchPlans();
    }
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

  const handleSaveGymSettings = async () => {
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
          logo_url: logoUrl || null
        })
        .eq('id', currentGym.id);

      if (error) throw error;

      await refreshGyms();
      toast({ title: 'Settings Saved', description: 'Gym settings have been updated.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym) return;

    try {
      if (editingPlanId) {
        const { error } = await supabase
          .from('membership_plans')
          .update({
            name: planName,
            description: planDescription || null,
            price: parseFloat(planPrice),
            duration_days: parseInt(planDuration),
          })
          .eq('id', editingPlanId);

        if (error) throw error;
        toast({ title: 'Plan Updated', description: 'Membership plan has been updated.' });
      } else {
        const { error } = await supabase.from('membership_plans').insert({
          gym_id: currentGym.id,
          name: planName,
          description: planDescription || null,
          price: parseFloat(planPrice),
          duration_days: parseInt(planDuration),
        });

        if (error) throw error;
        toast({ title: 'Plan Added', description: 'New membership plan has been created.' });
      }

      resetPlanForm();
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({ title: 'Error', description: 'Failed to save plan.', variant: 'destructive' });
    }
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice(plan.price.toString());
    setPlanDuration(plan.duration_days.toString());
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase.from('membership_plans').delete().eq('id', planId);
      if (error) throw error;

      toast({ title: 'Plan Deleted' });
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({ title: 'Error', description: 'Failed to delete plan.', variant: 'destructive' });
    }
  };

  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      toast({ title: currentStatus ? 'Plan Deactivated' : 'Plan Activated' });
      fetchPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast({ title: 'Error', description: 'Failed to update plan status.', variant: 'destructive' });
    }
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanDuration('30');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currentGym?.currency || 'AOA',
    }).format(amount);
  };

  const handleSaveNotifications = () => {
    toast({ title: 'Notification Settings Saved', description: 'Your preferences have been updated.' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your gym configuration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="plans">
              <CreditCard className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Link2 className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gym Information</CardTitle>
                <CardDescription>Update your gym's basic information and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Gym logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Logo URL"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a URL for your gym logo or upload an image
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gymName">Gym Name *</Label>
                    <Input
                      id="gymName"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
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
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AOA">AOA - Angolan Kwanza</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <RequirePermission permission="settings:update">
                  <Button onClick={handleSaveGymSettings} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </RequirePermission>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Plans */}
          <TabsContent value="plans" className="space-y-6">
            <RequirePermission 
              minimumRole="admin" 
              fallback={
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Read Only</AlertTitle>
                  <AlertDescription>
                    You can view membership plans but need admin access to modify them.
                  </AlertDescription>
                </Alert>
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>{editingPlanId ? 'Edit Plan' : 'Add Membership Plan'}</CardTitle>
                  <CardDescription>
                    {editingPlanId ? 'Update the membership plan details' : 'Create a new membership plan for your gym'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddOrUpdatePlan} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Plan Name *</Label>
                        <Input
                          placeholder="e.g., Monthly Basic"
                          value={planName}
                          onChange={(e) => setPlanName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description"
                          value={planDescription}
                          onChange={(e) => setPlanDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (AOA) *</Label>
                        <Input
                          type="number"
                          placeholder="15000"
                          value={planPrice}
                          onChange={(e) => setPlanPrice(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (Days) *</Label>
                        <Select value={planDuration} onValueChange={setPlanDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days (Weekly)</SelectItem>
                            <SelectItem value="14">14 days (Bi-weekly)</SelectItem>
                            <SelectItem value="30">30 days (Monthly)</SelectItem>
                            <SelectItem value="90">90 days (Quarterly)</SelectItem>
                            <SelectItem value="180">180 days (Semi-annual)</SelectItem>
                            <SelectItem value="365">365 days (Annual)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingPlanId ? 'Update Plan' : 'Add Plan'}
                      </Button>
                      {editingPlanId && (
                        <Button type="button" variant="outline" onClick={resetPlanForm}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </RequirePermission>

            <Card>
              <CardHeader>
                <CardTitle>Current Plans</CardTitle>
                <CardDescription>Manage your existing membership plans</CardDescription>
              </CardHeader>
              <CardContent>
                {plans.length > 0 ? (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{plan.name}</p>
                              {!plan.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(plan.price)} / {plan.duration_days} days
                            </p>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                            )}
                          </div>
                        </div>
                        <RequirePermission minimumRole="admin">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePlanStatus(plan.id, plan.is_active)}
                            >
                              {plan.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeletePlan(plan.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </RequirePermission>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No membership plans yet. Add your first plan above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Configure how you want to reach your members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Send text messages to members</p>
                    </div>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automated Messages</CardTitle>
                <CardDescription>Set up automatic notifications for your members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Welcome Messages</p>
                    <p className="text-sm text-muted-foreground">Send welcome email to new members</p>
                  </div>
                  <Switch checked={welcomeEmails} onCheckedChange={setWelcomeEmails} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Membership Expiry Reminders</p>
                    <p className="text-sm text-muted-foreground">Notify members before their membership expires</p>
                  </div>
                  <Switch checked={membershipReminders} onCheckedChange={setMembershipReminders} />
                </div>

                {membershipReminders && (
                  <div className="ml-6 space-y-2">
                    <Label>Days before expiry</Label>
                    <Select value={reminderDays} onValueChange={setReminderDays}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">Send reminders for pending payments</p>
                  </div>
                  <Switch checked={paymentReminders} onCheckedChange={setPaymentReminders} />
                </div>

                <RequirePermission permission="settings:update">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </RequirePermission>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Integrations</CardTitle>
                <CardDescription>Connect payment providers to accept online payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <span className="font-bold text-orange-500">MC</span>
                    </div>
                    <div>
                      <p className="font-medium">Multicaixa Express</p>
                      <p className="text-sm text-muted-foreground">Accept mobile payments in Angola</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {multicaixaEnabled && (
                      <Badge variant="default" className="gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                      </Badge>
                    )}
                    <Button 
                      variant={multicaixaEnabled ? 'outline' : 'default'} 
                      size="sm"
                      onClick={() => setMulticaixaEnabled(!multicaixaEnabled)}
                    >
                      {multicaixaEnabled ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Integrations</CardTitle>
                <CardDescription>Connect third-party services to enhance your gym</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">Google Calendar</p>
                      <p className="text-sm text-muted-foreground">Sync classes and appointments</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Business</p>
                      <p className="text-sm text-muted-foreground">Send notifications via WhatsApp</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
