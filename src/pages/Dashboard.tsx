// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, CreditCard, TrendingUp, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCheckInItem } from '@/components/dashboard/RecentCheckInItem';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';

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
  const { hasPermission } = useRBAC();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    todayCheckIns: 0,
    monthlyRevenue: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGym) {
      setLoading(false);
      return;
    }
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Estatísticas de membros
        const { count: totalMembers } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id);

        const { count: activeMembers } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id)
          .eq('status', 'active');

        // Check-ins de hoje
        const { count: todayCheckIns } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id)
          .gte('checked_in_at', today);

        // Receita mensal
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

        // Check-ins recentes
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
              member_name: memberMap.get(c.member_id) || 'Desconhecido',
              checked_in_at: c.checked_in_at,
            }))
          );
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
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

  // Sem ginásio configurado - prompt de configuração
  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Bem-vindo ao Nzila!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Comece configurando o seu espaço. Isto permitirá gerir membros, acompanhar check-ins e processar pagamentos.
          </p>
          <Link to="/onboarding">
            <Button size="lg" className="gradient-primary">
              Configurar Nzila
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta! Aqui está o que se passa no {currentGym.name}.
          </p>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Membros"
            value={stats.totalMembers}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Membros Ativos"
            value={stats.activeMembers}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Check-ins de Hoje"
            value={stats.todayCheckIns}
            icon={UserCheck}
            variant="default"
          />
          <RequirePermission permission="payments:read">
            <StatCard
              title="Receita Mensal"
              value={formatCurrency(stats.monthlyRevenue)}
              icon={CreditCard}
              variant="warning"
            />
          </RequirePermission>
        </div>

        {/* Atividade Recente e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-ins recentes */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                Check-ins Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length > 0 ? (
                <div className="space-y-2">
                  {recentCheckIns.map((checkIn) => (
                    <RecentCheckInItem
                      key={checkIn.id}
                      memberName={checkIn.member_name}
                      time={formatTime(checkIn.checked_in_at)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <UserCheck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Ainda não há check-ins hoje</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações rápidas */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionCard
                title="Adicionar Novo Membro"
                description="Registar um novo membro"
                icon={Users}
                href="/members"
                variant="primary"
              />
              <QuickActionCard
                title="Check-in Rápido"
                description="Registar presença de um membro"
                icon={UserCheck}
                href="/check-ins"
                variant="accent"
              />
              <RequirePermission permission="payments:create">
                <QuickActionCard
                  title="Registar Pagamento"
                  description="Adicionar um novo pagamento"
                  icon={CreditCard}
                  href="/payments"
                  variant="success"
                />
              </RequirePermission>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
