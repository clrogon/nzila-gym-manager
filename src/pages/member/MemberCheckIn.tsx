import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberQRCode from '@/components/member/MemberQRCode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  CheckCircle, 
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MemberData {
  id: string;
  full_name: string;
  status: string;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

interface ScheduledClass {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export default function MemberCheckIn() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { toast } = useToast();

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [todayClasses, setTodayClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (user && currentGym) {
      fetchData();
    }
  }, [user, currentGym]);

  const fetchData = async () => {
    if (!user || !currentGym) return;

    try {
      // Fetch member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, status')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .single();

      if (memberError) throw memberError;
      setMemberData(member);

      if (member) {
        // Fetch today's check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayCheckInData } = await supabase
          .from('check_ins')
          .select('id, checked_in_at, checked_out_at')
          .eq('member_id', member.id)
          .gte('checked_in_at', today.toISOString())
          .order('checked_in_at', { ascending: false })
          .limit(1)
          .single();

        setTodayCheckIn(todayCheckInData);

        // Fetch recent check-ins
        const { data: recentData } = await supabase
          .from('check_ins')
          .select('id, checked_in_at, checked_out_at')
          .eq('member_id', member.id)
          .order('checked_in_at', { ascending: false })
          .limit(10);

        setRecentCheckIns(recentData || []);

        // Fetch today's classes
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: classesData } = await supabase
          .from('classes')
          .select('id, title, start_time, end_time')
          .eq('gym_id', currentGym.id)
          .gte('start_time', today.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .order('start_time', { ascending: true });

        setTodayClasses(classesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!memberData || !currentGym) return;

    setCheckingIn(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .insert({
          member_id: memberData.id,
          gym_id: currentGym.id,
          checked_in_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Check-in realizado!',
        description: 'Bom treino!',
      });

      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer check-in.',
        variant: 'destructive',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!memberData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Perfil Não Encontrado</h2>
          <p className="text-muted-foreground">
            O seu perfil de membro ainda não foi criado.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const isCheckedIn = todayCheckIn !== null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Check-In</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: pt })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Check-in Button */}
          <Card className="md:row-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Estado do Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {isCheckedIn ? (
                <>
                  <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="mb-2">Presente</Badge>
                    <p className="text-lg font-medium">
                      Check-in às {format(new Date(todayCheckIn.checked_in_at), 'HH:mm')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bom treino, {memberData.full_name.split(' ')[0]}!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <UserCheck className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Ainda não fez check-in hoje
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handleCheckIn}
                      disabled={checkingIn || memberData.status !== 'active'}
                    >
                      {checkingIn ? 'A registar...' : 'Fazer Check-In'}
                    </Button>
                    {memberData.status !== 'active' && (
                      <p className="text-sm text-destructive">
                        Subscrição inativa. Contacte a receção.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          <MemberQRCode
            memberId={memberData.id}
            memberName={memberData.full_name}
          />

          {/* Today's Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Aulas de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma aula agendada para hoje
                </p>
              ) : (
                <div className="space-y-3">
                  {todayClasses.slice(0, 5).map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between text-sm border-l-2 border-primary pl-3"
                    >
                      <span className="font-medium">{cls.title}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(cls.start_time), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum check-in registado
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={`flex items-center justify-between text-sm p-3 rounded-lg ${
                      isToday(new Date(checkIn.checked_in_at))
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    <span>
                      {format(new Date(checkIn.checked_in_at), "dd MMM", { locale: pt })}
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
    </DashboardLayout>
  );
}
