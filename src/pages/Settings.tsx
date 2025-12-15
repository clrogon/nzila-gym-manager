// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  is_default?: boolean;
  max_members?: number;
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
  const [planType, setPlanType] = useState<'individual' | 'family'>('individual');
  const [planMaxMembers, setPlanMaxMembers] = useState<number | null>(null);
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

  const defaultPlans: Omit<MembershipPlan, 'id'>[] = [
    { name: 'Basic Monthly', description: 'Plano individual, acesso básico', price: 15000, duration_days: 30, is_active: true, is_default: true },
    { name: 'Premium Monthly', description: 'Plano individual, acesso completo + aulas', price: 25000, duration_days: 30, is_active: true },
    { name: 'Quarterly Basic', description: 'Plano individual trimestral, acesso básico', price: 40000, duration_days: 90, is_active: true },
    { name: 'Quarterly Premium', description: 'Plano individual trimestral, acesso completo + aulas', price: 70000, duration_days: 90, is_active: true },
    { name: 'Annual Standard', description: 'Plano anual individual, acesso completo', price: 250000, duration_days: 365, is_active: true },
    { name: 'Annual Premium', description: 'Plano anual individual + aulas ilimitadas', price: 350000, duration_days: 365, is_active: true },
    { name: 'Family Basic', description: 'Plano anual para até 4 membros da família, acesso básico', price: 400000, duration_days: 365, is_active: true, max_members: 4 },
    { name: 'Family Premium', description: 'Plano anual para até 4 membros da família, acesso completo', price: 600000, duration_days: 365, is_active: true, max_members: 4 },
    { name: 'Weekend Warrior', description: 'Plano mensal, acesso apenas finais de semana', price: 10000, duration_days: 30, is_active: true },
    { name: 'Trial', description: 'Plano experimental de 7 dias, acesso limitado', price: 3000, duration_days: 7, is_active: true },
  ];

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

    if (!data || data.length === 0) {
      for (const plan of defaultPlans) {
        await supabase.from('membership_plans').insert({
          gym_id: currentGym.id,
          ...plan
        });
      }
      const { data: newData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('price');
      setPlans(newData || []);
    } else {
      setPlans(data);
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
            max_members: planType === 'family' ? planMaxMembers : null
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
          max_members: planType === 'family' ? planMaxMembers : null
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

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanDuration('30');
    setPlanType('individual');
    setPlanMaxMembers(null);
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice(plan.price.toString());
    setPlanDuration(plan.duration_days.toString());
    setPlanType(plan.max_members ? 'family' : 'individual');
    setPlanMaxMembers(plan.max_members || null);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currentGym?.currency || 'AOA',
    }).format(amount);
  };

  // --- Gym settings save omitted for brevity, same as original code ---
  const handleSaveGymSettings = async () => { /* ... */ };
  const handleSaveNotifications = () => { /* ... */ };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your gym configuration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" />General</TabsTrigger>
            <TabsTrigger value="plans"><CreditCard className="w-4 h-4 mr-2" />Plans</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="w-4 h-4 mr-2" />Integrations</TabsTrigger>
          </TabsList>

          {/* Membership Plans */}
          <TabsContent value="plans" className="space-y-6">
            <RequirePermission minimumRole="admin" fallback={<Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Read Only</AlertTitle><AlertDescription>You can view membership plans but need admin access to modify them.</AlertDescription></Alert>}>
              <Card>
                <CardHeader>
                  <CardTitle>{editingPlanId ? 'Edit Plan' : 'Add Membership Plan'}</CardTitle>
                  <CardDescription>{editingPlanId ? 'Update the membership plan details' : 'Create a new membership plan for your gym'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddOrUpdatePlan} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Plan Name *</Label>
                        <Input placeholder="e.g., Monthly Basic" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input placeholder="Brief description" value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (AOA) *</Label>
                        <Input type="number" placeholder="15000" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (Days) *</Label>
                        <Select value={planDuration} onValueChange={setPlanDuration}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <div className="space-y-2">
                        <Label>Plan Type *</Label>
                        <Select value={planType} onValueChange={(val) => setPlanType(val as any)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {planType === 'family' && (
                        <div className="space-y-2">
                          <Label>Max Family Members *</Label>
                          <Input type="number" placeholder="4" value={planMaxMembers || ''} onChange={(e) => setPlanMaxMembers(parseInt(e.target.value))} required />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">{editingPlanId ? 'Update Plan' : 'Add Plan'}</Button>
                      {editingPlanId && <Button type="button" variant="outline" onClick={resetPlanForm}>Cancel</Button>}
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
                      <div key={plan.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{plan.name}</p>
                              {plan.is_default && <Badge variant="secondary">Default Plan</Badge>}
                              {plan.max_members && <Badge variant="secondary">Family Plan ({plan.max_members})</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{formatCurrency(plan.price)} / {plan.duration_days} days</p>
                            {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                          </div>
                        </div>
                        <RequirePermission minimumRole="admin">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleTogglePlanStatus(plan.id, plan.is_active)}>{plan.is_active ? 'Deactivate' : 'Activate'}</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </RequirePermission>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No membership plans yet. Add your first plan above.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ...notifications and integrations tabs remain unchanged from original code... */}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
