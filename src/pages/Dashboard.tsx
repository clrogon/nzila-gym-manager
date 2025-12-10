import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, CreditCard, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  monthlyRevenue: number;
}

interface RecentCheckIn {
  id: string;
  member_name: string;
  checked_in_at: string;
}

export default function Dashboard() {
  const { currentGym } = useGym();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    todayCheckIns: 0,
    monthlyRevenue: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGym) return;

    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Fetch member stats
        const { count: totalMembers } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id);

        const { count: activeMembers } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id)
          .eq('status', 'active');

        // Fetch today's check-ins
        const { count: todayCheckIns } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id)
          .gte('checked_in_at', today);

        // Fetch monthly revenue
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('gym_id', currentGym.id)
          .eq('payment_status', 'completed')
          .gte('created_at', monthStart);

        const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        setStats({
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          todayCheckIns: todayCheckIns || 0,
          monthlyRevenue,
        });

        // Fetch recent check-ins
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('id, checked_in_at, member_id')
          .eq('gym_id', currentGym.id)
          .order('checked_in_at', { ascending: false })
          .limit(5);

        if (checkIns && checkIns.length > 0) {
          const memberIds = checkIns.map(c => c.member_id);
          const { data: members } = await supabase
            .from('members')
            .select('id, full_name')
            .in('id', memberIds);

          const memberMap = new Map(members?.map(m => [m.id, m.full_name]));
          setRecentCheckIns(
            checkIns.map(c => ({
              id: c.id,
              member_name: memberMap.get(c.member_id) || 'Unknown',
              checked_in_at: c.checked_in_at,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentGym]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currentGym?.currency || 'AOA',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening at {currentGym?.name || 'your gym'}.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-success">{stats.activeMembers}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Check-ins
              </CardTitle>
              <UserCheck className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-accent">{stats.todayCheckIns}</div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <CreditCard className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length > 0 ? (
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{checkIn.member_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(checkIn.checked_in_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No check-ins yet today
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/members"
                className="block p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Add New Member</p>
                    <p className="text-sm text-muted-foreground">Register a new gym member</p>
                  </div>
                </div>
              </a>
              <a
                href="/check-ins"
                className="block p-4 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium">Quick Check-in</p>
                    <p className="text-sm text-muted-foreground">Record member attendance</p>
                  </div>
                </div>
              </a>
              <a
                href="/payments"
                className="block p-4 rounded-lg bg-success/10 hover:bg-success/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Record Payment</p>
                    <p className="text-sm text-muted-foreground">Add a new payment</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}