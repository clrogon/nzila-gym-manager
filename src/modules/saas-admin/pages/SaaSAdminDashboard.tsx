import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PlatformStats {
  totalGyms: number;
  activeGyms: number;
  trialGyms: number;
  totalMembers: number;
  monthlyRecurringRevenue: number;
  pastDueGyms: number;
}

interface GymMetrics {
  name: string;
  members: number;
  status: string;
  plan: string;
}

interface Subscription {
  gym_id: string;
  status: string;
  plan_id: string | null;
}

interface Plan {
  id: string;
  price_monthly: number;
}

export default function SaaSAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalGyms: 0,
    activeGyms: 0,
    trialGyms: 0,
    totalMembers: 0,
    monthlyRecurringRevenue: 0,
    pastDueGyms: 0,
  });
  const [gyms, setGyms] = useState<GymMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  const fetchPlatformMetrics = async () => {
    try {
      // Fetch all gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('*');

      if (gymsError) throw gymsError;

      const gymsArray = gymsData || [];

      // Fetch subscriptions - cast for new tables not yet in types
      const { data: rawSubscriptionsData, error: subsError } = await supabase
        .from('gym_subscriptions' as any)
        .select('gym_id, status, plan_id');

      if (subsError) throw subsError;
      const subscriptionsData = rawSubscriptionsData as unknown as Subscription[] | null;

      // Fetch plans for pricing
      const { data: rawPlansData, error: plansError } = await supabase
        .from('platform_plans' as any)
        .select('id, price_monthly');

      if (plansError) throw plansError;
      const plansData = rawPlansData as unknown as Plan[] | null;

      // Calculate metrics
      let totalMembers = 0;
      let monthlyRecurringRevenue = 0;
      const gymMetrics: GymMetrics[] = [];

      for (const gym of gymsArray) {
        const { count: memberCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', gym.id);

        totalMembers += memberCount || 0;

        const subscription = subscriptionsData?.find(
          (s) => s.gym_id === gym.id
        );
        const plan = plansData?.find((p) => p.id === subscription?.plan_id);

        if (subscription?.status === 'active' && plan) {
          monthlyRecurringRevenue += plan.price_monthly;
        }

        gymMetrics.push({
          name: gym.name,
          members: memberCount || 0,
          status: subscription?.status || 'trial',
          plan: plan?.id || 'basic',
        });
      }

      const activeGyms = gymsArray.filter(
        (g) => g.subscription_status === 'active'
      ).length;
      const trialGyms = gymsArray.filter(
        (g) => g.subscription_status === 'trial'
      ).length;
      const pastDueGyms = gymsArray.filter(
        (g) => g.subscription_status === 'past_due'
      ).length;

      setStats({
        totalGyms: gymsArray.length,
        activeGyms,
        trialGyms,
        totalMembers,
        monthlyRecurringRevenue,
        pastDueGyms,
      });

      setGyms(gymMetrics);
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading platform metrics...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold">SaaS Administration</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gyms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGyms}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeGyms} active, {stats.trialGyms} trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Across all gyms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthlyRecurringRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Recurring revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Due</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pastDueGyms}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gym Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Gym Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gyms.length === 0 ? (
                <p className="text-muted-foreground">No gyms found.</p>
              ) : (
                gyms.map((gym) => (
                  <div
                    key={gym.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{gym.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {gym.members} members
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          gym.status === 'active'
                            ? 'default'
                            : gym.status === 'trial'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {gym.status}
                      </Badge>
                      {gym.status === 'active' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
