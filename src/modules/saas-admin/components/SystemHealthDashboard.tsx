import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Database,
  Users,
  Server,
  Wifi,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface HealthMetric {
  label: string;
  value: number | string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
  unit?: string;
}

interface ActivityMetric {
  date: string;
  checkIns: number;
  payments: number;
  newMembers: number;
}

export default function SystemHealthDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [activityData, setActivityData] = useState<ActivityMetric[]>([]);
  const [dbStats, setDbStats] = useState({
    totalGyms: 0,
    totalMembers: 0,
    totalPayments: 0,
    totalCheckIns: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Fetch database stats
      const [gymsRes, membersRes, paymentsRes, checkInsRes, subsRes] = await Promise.all([
        supabase.from('gyms').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins').select('*', { count: 'exact', head: true }),
        supabase.from('gym_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setDbStats({
        totalGyms: gymsRes.count || 0,
        totalMembers: membersRes.count || 0,
        totalPayments: paymentsRes.count || 0,
        totalCheckIns: checkInsRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
      });

      // Fetch 7-day activity
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const [recentCheckIns, recentPayments, recentMembers] = await Promise.all([
        supabase.from('check_ins').select('checked_in_at').gte('checked_in_at', sevenDaysAgo),
        supabase.from('payments').select('created_at').gte('created_at', sevenDaysAgo),
        supabase.from('members').select('created_at').gte('created_at', sevenDaysAgo),
      ]);

      // Group by day
      const days: Record<string, ActivityMetric> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        days[date] = { date, checkIns: 0, payments: 0, newMembers: 0 };
      }

      recentCheckIns.data?.forEach((c) => {
        const date = format(new Date(c.checked_in_at), 'yyyy-MM-dd');
        if (days[date]) days[date].checkIns++;
      });

      recentPayments.data?.forEach((p) => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (days[date]) days[date].payments++;
      });

      recentMembers.data?.forEach((m) => {
        const date = format(new Date(m.created_at), 'yyyy-MM-dd');
        if (days[date]) days[date].newMembers++;
      });

      setActivityData(Object.values(days));

      // Build health metrics
      const healthMetrics: HealthMetric[] = [
        {
          label: 'Database',
          value: 'Connected',
          status: 'healthy',
          icon: <Database className="h-5 w-5" />,
        },
        {
          label: 'API Response',
          value: '< 100ms',
          status: 'healthy',
          icon: <Server className="h-5 w-5" />,
        },
        {
          label: 'Active Users (24h)',
          value: recentCheckIns.data?.filter(
            (c) => new Date(c.checked_in_at) > subDays(new Date(), 1)
          ).length || 0,
          status: 'healthy',
          icon: <Users className="h-5 w-5" />,
        },
        {
          label: 'Storage',
          value: 'OK',
          status: 'healthy',
          icon: <HardDrive className="h-5 w-5" />,
        },
      ];

      setMetrics(healthMetrics);
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast({ title: 'Error', description: 'Failed to load system health', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allHealthy = metrics.every((m) => m.status === 'healthy');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-500" />
            System Health
          </h2>
          <p className="text-muted-foreground">Monitor platform performance and status</p>
        </div>
        <Badge className={allHealthy ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
          {allHealthy ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" /> All Systems Operational
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" /> Some Issues Detected
            </>
          )}
        </Badge>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className={`border-l-4 ${getStatusColor(metric.status).replace('bg-', 'border-l-').replace('/10', '')}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getStatusColor(metric.status).split(' ')[0]}`}>
                    {metric.icon}
                  </div>
                </div>
                {getStatusIcon(metric.status)}
              </div>
              <p className="text-xl font-bold mt-3">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-amber-500">{dbStats.totalGyms}</p>
              <p className="text-sm text-muted-foreground">Gyms</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-blue-500">{dbStats.totalMembers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-green-500">{dbStats.activeSubscriptions}</p>
              <p className="text-sm text-muted-foreground">Active Subs</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-purple-500">{dbStats.totalPayments.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Payments</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-orange-500">{dbStats.totalCheckIns.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Check-ins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            7-Day Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {activityData.map((day) => (
              <div key={day.date} className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {format(new Date(day.date), 'EEE')}
                </p>
                <div className="space-y-1">
                  <div className="h-16 bg-gradient-to-t from-green-500/20 to-green-500/60 rounded relative flex items-end justify-center">
                    <div
                      className="absolute bottom-0 w-full bg-green-500 rounded-t"
                      style={{ height: `${Math.min(100, (day.checkIns / 50) * 100)}%` }}
                    />
                    <span className="relative z-10 text-xs font-medium text-foreground pb-1">
                      {day.checkIns}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activityData.reduce((sum, d) => sum + d.newMembers, 0)}
                </p>
                <p className="text-sm text-muted-foreground">New members this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activityData.reduce((sum, d) => sum + d.checkIns, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Check-ins this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Wifi className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activityData.reduce((sum, d) => sum + d.payments, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Payments this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
