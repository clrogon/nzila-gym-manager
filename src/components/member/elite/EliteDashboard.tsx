import { useState, useEffect } from 'react';
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
  User,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
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

interface WeeklyActivity {
  day: string;
  value: number;
}

export function EliteDashboard() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<UpcomingSession | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock stats - replace with real data
  const stats = {
    calories: 2480,
    caloriesTrend: '+5%',
    steps: 12542,
    stepsTrend: '+12%',
    heartRate: 68,
    heartTrend: 'Estável',
    weeklyProgress: 84,
    weeklyTrend: '+12%'
  };

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberData();
    }
  }, [user, currentGym]);

  const fetchMemberData = async () => {
    if (!user || !currentGym) return;

    try {
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

      // Fetch upcoming classes/sessions
      if (member) {
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select(`
            id,
            classes(id, title, start_time, locations(name))
          `)
          .eq('member_id', member.id)
          .eq('status', 'confirmed')
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

        // Generate mock weekly activity
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        setWeeklyActivity(days.map(day => ({
          day,
          value: Math.random() * 100
        })));
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const firstName = memberData?.full_name?.split(' ')[0] || 'Membro';
  const tierName = memberData?.membership_plan?.name || 'Gold Tier';

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
                      {stats.weeklyTrend} esta semana
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Níveis de Atividade</p>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="flex items-end gap-2 h-32">
                {weeklyActivity.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{ 
                        height: `${day.value}%`,
                        background: day.value > 70 
                          ? 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--brand-accent)))' 
                          : 'hsl(var(--muted))'
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
                    onClick={() => navigate('/bookings')}
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
            icon={Flame}
            label="Calorias"
            value={stats.calories.toLocaleString()}
            unit="kcal"
            trend={stats.caloriesTrend}
            trendUp
            iconColor="text-orange-500"
          />
          <StatCard
            icon={Footprints}
            label="Passos Diários"
            value={stats.steps.toLocaleString()}
            unit="passos"
            trend={stats.stepsTrend}
            trendUp
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Heart}
            label="Freq. Cardíaca"
            value={stats.heartRate.toString()}
            unit="BPM"
            trend={stats.heartTrend}
            iconColor="text-red-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Progresso"
            value={stats.weeklyProgress.toString()}
            unit="%"
            trend={stats.weeklyTrend}
            trendUp
            iconColor="text-primary"
          />
        </div>

        {/* Programs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Programas Personalizados</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProgramCard
              title="Power Lifting Avançado"
              category="Força"
              duration="12 Semanas"
              frequency="5 Dias/semana"
              progress={65}
              image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"
            />
            <ProgramCard
              title="Elite Yoga Flow"
              category="Mindfulness"
              duration="8 Semanas"
              frequency="3 Dias/semana"
              progress={30}
              image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
            />
          </div>
        </div>
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
              {trendUp && <ArrowUpRight className="w-3 h-3 inline mr-0.5" />}
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

// Program Card Component
function ProgramCard({
  title,
  category,
  duration,
  frequency,
  progress,
  image
}: {
  title: string;
  category: string;
  duration: string;
  frequency: string;
  progress: number;
  image: string;
}) {
  return (
    <Card className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer">
      <div className="flex">
        <div 
          className="w-32 h-32 bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${image})` }}
        />
        <CardContent className="py-4 flex-1">
          <Badge variant="outline" className="text-xs mb-2 border-primary/50 text-primary">
            {category}
          </Badge>
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{duration} • {frequency}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default EliteDashboard;