import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Bell,
  Calendar,
  Flame,
  Footprints,
  Heart,
  MapPin,
  Clock,
  ChevronRight,
  TrendingUp,
  Dumbbell,
  Sparkles,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MemberData {
  id: string;
  full_name: string;
  email: string | null;
  status: string;
  photo_url: string | null;
  membership_plan: {
    name: string;
  } | null;
}

interface UpcomingSession {
  id: string;
  title: string;
  start_time: string;
  coach_name?: string;
  location?: string;
}

interface CheckInData {
  id: string;
  checked_in_at: string;
}

interface WorkoutAssignment {
  id: string;
  workout_name: string;
  category: string | null;
  assigned_date: string;
  completed_at: string | null;
}

export function EliteDashboard() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<UpcomingSession | null>(null);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<CheckInData[]>([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState<WorkoutAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate weekly activity from check-ins
  const weeklyActivity = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: today });
    
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return dayNames.map((dayName, index) => {
      const targetDate = new Date(weekStart);
      targetDate.setDate(targetDate.getDate() + index);
      
      const hasCheckIn = weeklyCheckIns.some(ci => 
        isSameDay(new Date(ci.checked_in_at), targetDate)
      );
      
      return {
        day: dayName,
        value: hasCheckIn ? 100 : 0,
        isPast: targetDate <= today
      };
    });
  }, [weeklyCheckIns]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const checkInCount = weeklyCheckIns.length;
    const completedWorkouts = assignedWorkouts.filter(w => w.completed_at).length;
    const totalWorkouts = assignedWorkouts.length;
    const weeklyProgress = totalWorkouts > 0 
      ? Math.round((completedWorkouts / totalWorkouts) * 100) 
      : (checkInCount > 0 ? Math.min(checkInCount * 15, 100) : 0);
    
    return {
      checkIns: checkInCount,
      checkInsTrend: checkInCount > 0 ? `+${checkInCount}` : '0',
      completedWorkouts,
      workoutsTrend: completedWorkouts > 0 ? `+${completedWorkouts}` : '0',
      weeklyProgress,
      weeklyTrend: weeklyProgress > 50 ? `+${weeklyProgress - 50}%` : `${weeklyProgress}%`,
      totalWorkouts
    };
  }, [weeklyCheckIns, assignedWorkouts]);

  useEffect(() => {
    if (user && currentGym) {
      fetchAllData();
    }
  }, [user, currentGym]);

  const fetchAllData = async () => {
    if (!user || !currentGym) return;

    try {
      // Fetch member data
      const { data: member } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          email,
          status,
          photo_url,
          membership_plan:membership_plans(name)
        `)
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .single();

      setMemberData(member as MemberData);

      if (member) {
        // Fetch upcoming classes/sessions
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select(`
            id,
            classes(id, title, start_time, locations(name))
          `)
          .eq('member_id', member.id)
          .in('status', ['confirmed', 'booked'])
          .gte('classes.start_time', new Date().toISOString())
          .order('classes(start_time)', { ascending: true })
          .limit(1);

        if (bookings?.[0]?.classes) {
          const cls = bookings[0].classes as any;
          setUpcomingSession({
            id: cls.id,
            title: cls.title,
            start_time: cls.start_time,
            location: cls.locations?.name
          });
        }

        // Fetch weekly check-ins
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('id, checked_in_at')
          .eq('member_id', member.id)
          .eq('gym_id', currentGym.id)
          .gte('checked_in_at', weekStart.toISOString())
          .order('checked_in_at', { ascending: false });

        setWeeklyCheckIns(checkIns || []);

        // Fetch assigned workouts for the week
        const { data: workouts } = await supabase
          .from('member_workouts')
          .select(`
            id,
            assigned_date,
            completed_at,
            workout_template:workout_templates(name, category)
          `)
          .eq('member_id', member.id)
          .gte('assigned_date', weekStart.toISOString().split('T')[0])
          .order('assigned_date', { ascending: false });

        const formattedWorkouts = (workouts || []).map(w => ({
          id: w.id,
          workout_name: (w.workout_template as any)?.name || 'Treino',
          category: (w.workout_template as any)?.category || null,
          assigned_date: w.assigned_date,
          completed_at: w.completed_at
        }));

        setAssignedWorkouts(formattedWorkouts);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const firstName = memberData?.full_name?.split(' ')[0] || 'Membro';
  const tierName = memberData?.membership_plan?.name || 'Membro';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Bem-vindo, <span className="text-gradient">{firstName}</span>
            </h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {tierName}
              </Badge>
              {memberData?.status === 'active' && (
                <Badge variant="outline" className="border-success/50 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly Progress Card */}
          <Card className="lg:col-span-2 glass border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Progresso Semanal</CardTitle>
                <span className="text-sm text-muted-foreground">Seg - Dom</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-primary">{stats.weeklyProgress}%</span>
                    <Badge variant="outline" className="text-success border-success/50">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stats.checkIns} check-ins
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.completedWorkouts} de {stats.totalWorkouts} treinos completados
                  </p>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="flex items-end gap-2 h-32">
                {weeklyActivity.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{ 
                        height: day.isPast ? `${Math.max(day.value, 10)}%` : '10%',
                        background: day.value > 0 
                          ? 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--brand-accent)))' 
                          : day.isPast
                            ? 'hsl(var(--muted))'
                            : 'hsl(var(--muted) / 0.3)'
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Session Card */}
          <Card className="glass border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Próxima Sessão</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {upcomingSession ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{upcomingSession.title}</h3>
                    {upcomingSession.coach_name && (
                      <p className="text-sm text-muted-foreground">Com {upcomingSession.coach_name}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      {format(new Date(upcomingSession.start_time), "EEEE, HH:mm", { locale: pt })}
                    </div>
                    {upcomingSession.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        {upcomingSession.location}
                      </div>
                    )}
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Ver Detalhes
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">Nenhuma sessão agendada</p>
                  <Button 
                    variant="outline" 
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => navigate('/calendar')}
                  >
                    Agendar Treino
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CheckCircle2}
            label="Check-ins"
            value={stats.checkIns.toString()}
            unit="esta semana"
            trend={stats.checkInsTrend}
            trendUp={stats.checkIns > 0}
            iconColor="text-success"
          />
          <StatCard
            icon={Dumbbell}
            label="Treinos Concluídos"
            value={stats.completedWorkouts.toString()}
            unit={`de ${stats.totalWorkouts}`}
            trend={stats.workoutsTrend}
            trendUp={stats.completedWorkouts > 0}
            iconColor="text-primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Progresso"
            value={stats.weeklyProgress.toString()}
            unit="%"
            trend={stats.weeklyTrend}
            trendUp={stats.weeklyProgress > 50}
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Flame}
            label="Sequência"
            value={stats.checkIns.toString()}
            unit="dias ativos"
            trend={stats.checkIns >= 3 ? '🔥' : ''}
            trendUp={stats.checkIns >= 3}
            iconColor="text-orange-500"
          />
        </div>

        {/* Workouts Section */}
        {assignedWorkouts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold">Treinos Atribuídos</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {assignedWorkouts.slice(0, 4).map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State for New Members */}
        {!loading && assignedWorkouts.length === 0 && weeklyCheckIns.length === 0 && (
          <Card className="glass border-white/10 p-8 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comece a Sua Jornada</h3>
            <p className="text-muted-foreground mb-4">
              Faça check-in no ginásio ou agende uma aula para começar a acompanhar o seu progresso.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/check-ins')} className="bg-primary text-primary-foreground">
                Fazer Check-in
              </Button>
              <Button onClick={() => navigate('/calendar')} variant="outline">
                Ver Aulas
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  trend, 
  trendUp,
  iconColor 
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  trend: string;
  trendUp?: boolean;
  iconColor: string;
}) {
  return (
    <Card className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-colors">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-muted-foreground'}`}>
              {trendUp && trend !== '🔥' && <ArrowUpRight className="w-3 h-3 inline mr-0.5" />}
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Workout Card Component
function WorkoutCard({ workout }: { workout: WorkoutAssignment }) {
  const isCompleted = !!workout.completed_at;
  
  return (
    <Card className={`glass border-white/10 overflow-hidden group hover:border-primary/30 transition-all ${isCompleted ? 'opacity-75' : ''}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {workout.category && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  {workout.category}
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-success/20 text-success border-success/30 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Concluído
                </Badge>
              )}
            </div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">
              {workout.workout_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(workout.assigned_date), "EEEE, d 'de' MMMM", { locale: pt })}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-primary">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default EliteDashboard;
