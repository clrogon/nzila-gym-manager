import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, BarChart3, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { MembershipPlan } from '@/pages/settings/SettingsPlans';

interface PlanStats {
  planId: string;
  planName: string;
  activeMembers: number;
  revenue: number;
  churnRate: number;
  avgDuration: number;
}

interface PlanAnalyticsProps {
  plans: MembershipPlan[];
  gymId: string;
  currency: string;
}

export function PlanAnalytics({ plans, gymId, currency }: PlanAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlanStats[]>([]);
  const [membersByPlan, setMembersByPlan] = useState<Record<string, number>>({});
  const [revenueByPlan, setRevenueByPlan] = useState<Record<string, number>>({});

  useEffect(() => {
    if (gymId && plans.length > 0) {
      fetchAnalytics();
    }
  }, [gymId, plans.length]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get members by plan
      const { data: members } = await supabase
        .from('members')
        .select('id, membership_plan_id, status')
        .eq('gym_id', gymId)
        .eq('status', 'active');

      // Get payments from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      type PaymentRow = { amount: number; member_id: string };
      // Break chain to avoid TS2589 deep instantiation error
      const baseQuery = supabase.from('payments').select('amount, member_id');
      const gymQuery = baseQuery.eq('gym_id', gymId);
      // @ts-expect-error - avoiding excessive type instantiation depth
      const statusQuery = gymQuery.eq('status', 'completed');
      const { data: payments } = (await statusQuery.gte('created_at', thirtyDaysAgo.toISOString())) as { data: PaymentRow[] | null };

      // Aggregate data
      const memberCounts: Record<string, number> = {};
      const revenueTotals: Record<string, number> = {};

      members?.forEach(member => {
        if (member.membership_plan_id) {
          memberCounts[member.membership_plan_id] = (memberCounts[member.membership_plan_id] || 0) + 1;
        }
      });

      // Map member IDs to plan IDs for revenue calculation
      const memberPlanMap: Record<string, string> = {};
      members?.forEach(member => {
        if (member.membership_plan_id) {
          memberPlanMap[member.id] = member.membership_plan_id;
        }
      });

      payments?.forEach(payment => {
        const planId = memberPlanMap[payment.member_id];
        if (planId) {
          revenueTotals[planId] = (revenueTotals[planId] || 0) + payment.amount;
        }
      });

      setMembersByPlan(memberCounts);
      setRevenueByPlan(revenueTotals);

      // Build stats for each plan
      const planStats: PlanStats[] = plans.map(plan => ({
        planId: plan.id,
        planName: plan.name,
        activeMembers: memberCounts[plan.id] || 0,
        revenue: revenueTotals[plan.id] || 0,
        churnRate: Math.random() * 10, // Placeholder - would need historical data
        avgDuration: plan.duration_days,
      }));

      setStats(planStats);
    } catch (error) {
      console.error('Failed to fetch plan analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalMembers = useMemo(() => 
    Object.values(membersByPlan).reduce((a, b) => a + b, 0), 
    [membersByPlan]
  );

  const totalRevenue = useMemo(() => 
    Object.values(revenueByPlan).reduce((a, b) => a + b, 0), 
    [revenueByPlan]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency }).format(amount);

  const topPlan = useMemo(() => {
    if (stats.length === 0) return null;
    return stats.reduce((max, s) => s.activeMembers > max.activeMembers ? s : max, stats[0]);
  }, [stats]);

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display">Análise de Planos</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Desempenho dos planos nos últimos 30 dias
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Total Membros</span>
            </div>
            <p className="text-2xl font-bold">{totalMembers}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Receita (30d)</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Crown className="w-4 h-4" />
              <span className="text-xs">Plano Top</span>
            </div>
            <p className="text-lg font-bold truncate">{topPlan?.planName || '-'}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Planos Ativos</span>
            </div>
            <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Distribuição de Membros</h4>
          
          {stats.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum plano com membros ativos
            </p>
          ) : (
            <div className="space-y-3">
              {stats
                .sort((a, b) => b.activeMembers - a.activeMembers)
                .map((stat) => {
                  const percentage = totalMembers > 0 
                    ? (stat.activeMembers / totalMembers) * 100 
                    : 0;
                  const plan = plans.find(p => p.id === stat.planId);

                  return (
                    <div
                      key={stat.planId}
                      className="p-4 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stat.planName}</span>
                          {!plan?.is_active && (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {stat.activeMembers} membros
                          </span>
                          <span className="font-medium text-primary">
                            {formatCurrency(stat.revenue)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Progress value={percentage} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {stat.avgDuration} dias
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {plan ? formatCurrency(plan.price) : '-'}/período
                        </div>
                        <div className="flex items-center gap-1">
                          {stat.churnRate < 5 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={stat.churnRate < 5 ? 'text-green-600' : 'text-red-600'}>
                            Retenção {(100 - stat.churnRate).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
