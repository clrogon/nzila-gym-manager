import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MembershipStatusCard from '@/components/member/MembershipStatusCard';
import MemberFinancialSummary from '@/components/member/MemberFinancialSummary';
import MemberActivityHeatmap from '@/components/member/MemberActivityHeatmap';
import MemberQRCode from '@/components/member/MemberQRCode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserCheck, 
  CalendarDays, 
  CreditCard, 
  TrendingUp,
  Home,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MemberData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  photo_url: string | null;
  membership_start_date: string | null;
  membership_end_date: string | null;
  membership_plan: {
    id: string;
    name: string;
    price: number;
  } | null;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string | null;
  payment_status: string;
}

export default function MemberPortal() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberData();
    }
  }, [user, currentGym]);

  const fetchMemberData = async () => {
    if (!user || !currentGym) return;

    try {
      // Fetch member profile
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          email,
          phone,
          status,
          photo_url,
          membership_start_date,
          membership_end_date,
          membership_plan:membership_plans(id, name, price)
        `)
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        setLoading(false);
        return;
      }
      setMemberData(member as MemberData);

      if (member) {
        // Fetch check-ins
        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('id, checked_in_at')
          .eq('member_id', member.id)
          .order('checked_in_at', { ascending: false })
          .limit(100);

        setCheckIns(checkInData || []);

        // Fetch payments
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, amount, paid_at, payment_status')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setPayments(paymentData || []);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const outstandingBalance = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const lastPaidPayment = payments.find(p => p.payment_status === 'completed' && p.paid_at);

  const recentCheckIns = checkIns.slice(0, 5);

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Nenhum Ginásio</h2>
          <p className="text-muted-foreground">Não está associado a nenhum ginásio.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!memberData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Perfil Não Encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O seu perfil de membro ainda não foi criado.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, contacte a receção do ginásio.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">
            Olá, {memberData.full_name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao {currentGym.name}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/member/checkin')}
          >
            <UserCheck className="w-6 h-6 text-primary" />
            <span className="text-sm">Check-In</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/bookings')}
          >
            <CalendarDays className="w-6 h-6 text-primary" />
            <span className="text-sm">Aulas</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/member/finances')}
          >
            <CreditCard className="w-6 h-6 text-primary" />
            <span className="text-sm">Pagamentos</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/member/activity')}
          >
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-sm">Progresso</span>
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Membership Status */}
          <MembershipStatusCard
            planName={memberData.membership_plan?.name || null}
            status={memberData.status}
            startDate={memberData.membership_start_date}
            endDate={memberData.membership_end_date}
            onRenew={() => navigate('/member/finances')}
          />

          {/* Financial Summary */}
          <MemberFinancialSummary
            outstandingBalance={outstandingBalance}
            currency={currentGym.currency || 'AOA'}
            lastPaymentDate={lastPaidPayment?.paid_at}
            lastPaymentAmount={lastPaidPayment?.amount}
          />

          {/* QR Code */}
          <MemberQRCode
            memberId={memberData.id}
            memberName={memberData.full_name}
          />
        </div>

        {/* Activity Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Activity Heatmap */}
          <MemberActivityHeatmap checkIns={checkIns} />

          {/* Recent Check-ins */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Check-ins Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum check-in registado
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {format(new Date(checkIn.checked_in_at), "EEEE, dd MMM", { locale: pt })}
                      </span>
                      <span className="font-medium">
                        {format(new Date(checkIn.checked_in_at), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
