import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberActivityHeatmap from '@/components/member/MemberActivityHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Calendar,
  Award,
  Dumbbell,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MemberData {
  id: string;
  full_name: string;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
}

interface ClassBooking {
  id: string;
  status: string;
  checked_in_at: string | null;
  booked_at: string;
  class: {
    id: string;
    title: string;
    start_time: string;
  } | null;
}

interface MemberRank {
  id: string;
  awarded_at: string;
  discipline: {
    name: string;
  } | null;
  rank: {
    name: string;
    color: string | null;
    level: number;
  } | null;
}

interface PerformanceRecord {
  id: string;
  exercise_name: string;
  value: number;
  unit: string;
  is_pr: boolean;
  recorded_at: string;
}

export default function MemberActivity() {
  const { user } = useAuth();
  const { currentGym } = useGym();

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [ranks, setRanks] = useState<MemberRank[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('id, full_name')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .single();

      if (memberError) throw memberError;
      setMemberData(member);

      if (member) {
        // Fetch check-ins
        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('id, checked_in_at')
          .eq('member_id', member.id)
          .order('checked_in_at', { ascending: false })
          .limit(365);

        setCheckIns(checkInData || []);

        // Fetch class bookings
        const { data: bookingData } = await supabase
          .from('class_bookings')
          .select(`
            id,
            status,
            checked_in_at,
            booked_at,
            class:classes(id, title, start_time)
          `)
          .eq('member_id', member.id)
          .order('booked_at', { ascending: false })
          .limit(50);

        setBookings((bookingData as ClassBooking[]) || []);

        // Fetch ranks
        const { data: rankData } = await supabase
          .from('member_ranks')
          .select(`
            id,
            awarded_at,
            discipline:disciplines(name),
            rank:discipline_ranks(name, color, level)
          `)
          .eq('member_id', member.id)
          .order('awarded_at', { ascending: false });

        setRanks((rankData as MemberRank[]) || []);

        // Fetch performance records
        const { data: performanceData } = await supabase
          .from('performance_records')
          .select('id, exercise_name, value, unit, is_pr, recorded_at')
          .eq('member_id', member.id)
          .order('recorded_at', { ascending: false })
          .limit(20);

        setPerformanceRecords(performanceData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
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

  const attendedClasses = bookings.filter(b => b.checked_in_at).length;
  const cancelledClasses = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">O Meu Progresso</h1>
          <p className="text-muted-foreground">
            Acompanhe a sua atividade e evolução
          </p>
        </div>

        {/* Activity Heatmap */}
        <MemberActivityHeatmap checkIns={checkIns} />

        {/* Tabs */}
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classes">Aulas</TabsTrigger>
            <TabsTrigger value="ranks">Graduações</TabsTrigger>
            <TabsTrigger value="records">Recordes</TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{bookings.length}</div>
                  <p className="text-sm text-muted-foreground">Total Reservas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{attendedClasses}</div>
                  <p className="text-sm text-muted-foreground">Aulas Assistidas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-muted-foreground">{cancelledClasses}</div>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Histórico de Aulas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma aula reservada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{booking.class?.title || 'Aula'}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.class?.start_time
                              ? format(new Date(booking.class.start_time), "dd MMM yyyy 'às' HH:mm", { locale: pt })
                              : '-'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.checked_in_at ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Presente
                            </Badge>
                          ) : booking.status === 'cancelled' ? (
                            <Badge variant="secondary">Cancelada</Badge>
                          ) : (
                            <Badge variant="outline">Reservada</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranks Tab */}
          <TabsContent value="ranks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  As Minhas Graduações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranks.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma graduação registada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ranks.map((rank) => (
                      <div
                        key={rank.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: rank.rank?.color || '#888' }}
                          />
                          <div>
                            <p className="font-medium">{rank.rank?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {rank.discipline?.name}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(rank.awarded_at), 'dd MMM yyyy', { locale: pt })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Recordes Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum recorde registado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {performanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{record.exercise_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.recorded_at), 'dd MMM yyyy', { locale: pt })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {record.value} {record.unit}
                          </span>
                          {record.is_pr && (
                            <Badge variant="default" className="bg-yellow-500">
                              PR
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
