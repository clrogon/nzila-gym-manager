import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, CreditCard, Save, AlertCircle } from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  // New plan form
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('30');

  useEffect(() => {
    if (currentGym) {
      setGymName(currentGym.name);
      setPhone(currentGym.phone || '');
      setAddress(currentGym.address || '');
      setEmail(currentGym.email || '');
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
        .update({ name: gymName, phone, address, email })
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

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym) return;

    try {
      const { error } = await supabase.from('membership_plans').insert({
        gym_id: currentGym.id,
        name: planName,
        price: parseFloat(planPrice),
        duration_days: parseInt(planDuration),
      });

      if (error) throw error;

      toast({ title: 'Plan Added', description: 'New membership plan has been created.' });
      setPlanName('');
      setPlanPrice('');
      setPlanDuration('30');
      fetchPlans();
    } catch (error) {
      console.error('Error adding plan:', error);
      toast({ title: 'Error', description: 'Failed to add plan.', variant: 'destructive' });
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currentGym?.currency || 'AOA',
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your gym settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="plans">
              <CreditCard className="w-4 h-4 mr-2" />
              Membership Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Gym Information</CardTitle>
                <CardDescription>Update your gym's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gymName">Gym Name</Label>
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
                <RequirePermission permission="settings:update">
                  <Button onClick={handleSaveGymSettings} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </RequirePermission>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <CardTitle>Add Membership Plan</CardTitle>
                  <CardDescription>Create a new membership plan for your gym</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPlan} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Plan name"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Days"
                        value={planDuration}
                        onChange={(e) => setPlanDuration(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit">Add Plan</Button>
                  </form>
                </CardContent>
              </Card>
            </RequirePermission>

            <Card>
              <CardHeader>
                <CardTitle>Current Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {plans.length > 0 ? (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(plan.price)} / {plan.duration_days} days
                          </p>
                        </div>
                        <RequirePermission minimumRole="admin">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            Delete
                          </Button>
                        </RequirePermission>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No membership plans yet. Add your first plan above.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}