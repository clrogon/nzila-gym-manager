import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy,
  Flame,
  Heart,
  Clock,
  Dumbbell,
  TrendingUp,
  Share2,
  Home,
  Zap,
  Award,
  Target,
  MessageSquare,
  Star
} from 'lucide-react';

interface WorkoutResults {
  duration: number;
  calories: number;
  heartRate: number;
  exercisesCompleted: number;
}

export function WorkoutSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const { user } = useAuth();
  const { currentGym } = useGym();

  // Get results from navigation state or fetch from DB
  const stateResults = location.state as WorkoutResults | undefined;

  const { data: savedResults, isLoading } = useQuery({
    queryKey: ['workout-results', workoutId],
    queryFn: async () => {
      if (stateResults) return null; // Use state if available
      
      if (!workoutId) return null;
      
      const { data, error } = await supabase
        .from('member_workouts')
        .select('results, completed_at')
        .eq('id', workoutId)
        .maybeSingle();
      
      if (error) throw error;
      
      const results = data?.results as any;
      return results ? {
        duration: results.duration_seconds || 0,
        calories: results.calories_burned || 0,
        heartRate: results.avg_heart_rate || 0,
        exercisesCompleted: 5, // Default
      } : null;
    },
    enabled: !!workoutId && !stateResults,
  });

  const results = stateResults || savedResults || {
    duration: 2700, // 45 min default
    calories: 320,
    heartRate: 128,
    exercisesCompleted: 5,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock heart rate zones (in production, calculate from actual data)
  const heartRateZones = [
    { zone: 'Aquecimento', min: 50, max: 60, percentage: 15, color: 'bg-blue-500' },
    { zone: 'Queima Gordura', min: 60, max: 70, percentage: 25, color: 'bg-green-500' },
    { zone: 'Cardio', min: 70, max: 80, percentage: 35, color: 'bg-yellow-500' },
    { zone: 'Intenso', min: 80, max: 90, percentage: 20, color: 'bg-orange-500' },
    { zone: 'Máximo', min: 90, max: 100, percentage: 5, color: 'bg-red-500' },
  ];

  // Personal bests (mock data - in production, compare with performance_records)
  const personalBests = [
    { exercise: 'Supino', value: '80kg', isNew: true },
    { exercise: 'Agachamento', value: '100kg', isNew: false },
    { exercise: 'Remada', value: '60kg', isNew: true },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-brand-accent mb-4">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Treino <span className="text-gradient">Concluído!</span>
          </h1>
          <p className="text-muted-foreground">Excelente trabalho! Aqui está o seu resumo de performance.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Duração"
            value={formatDuration(results.duration)}
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Flame}
            label="Calorias"
            value={`${results.calories}`}
            unit="kcal"
            iconColor="text-orange-500"
          />
          <StatCard
            icon={Heart}
            label="FC Média"
            value={`${results.heartRate}`}
            unit="bpm"
            iconColor="text-red-500"
          />
          <StatCard
            icon={Dumbbell}
            label="Exercícios"
            value={`${results.exercisesCompleted}`}
            unit="feitos"
            iconColor="text-primary"
          />
        </div>

        {/* Detailed Analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Heart Rate Zones */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Zonas de Frequência Cardíaca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {heartRateZones.map((zone, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{zone.zone}</span>
                    <span className="font-medium">{zone.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${zone.color} rounded-full transition-all`}
                      style={{ width: `${zone.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Métricas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-xs text-muted-foreground">Intensidade</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-xs text-muted-foreground">Precisão</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-brand-accent/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Score Geral</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Star className="w-3 h-3 mr-1" />
                    Excelente
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={89} className="flex-1 h-3" />
                  <span className="text-xl font-bold text-primary">89</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Bests */}
        <Card className="glass border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Recordes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {personalBests.map((pb, index) => (
                <div 
                  key={index}
                  className={`
                    p-4 rounded-xl border transition-all
                    ${pb.isNew 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-white/5 border-white/10'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{pb.exercise}</span>
                    {pb.isNew && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        NOVO!
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{pb.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trainer Feedback (Mock) */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Feedback do Treinador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-brand-accent/20 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground italic">
                  "Excelente progresso no treino de hoje! A tua técnica no supino melhorou significativamente. 
                  Continua assim e vamos aumentar a carga na próxima sessão. 💪"
                </p>
                <p className="text-xs text-muted-foreground">— O seu treinador virtual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'Treino Concluído!',
                  text: `Completei um treino de ${formatDuration(results.duration)} e queimei ${results.calories} calorias! 💪`,
                });
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partilhar
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate('/member/elite')}
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
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
  iconColor 
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  iconColor: string;
}) {
  return (
    <Card className="glass border-white/10 overflow-hidden">
      <CardContent className="pt-5">
        <div className={`p-2 rounded-lg bg-white/5 ${iconColor} w-fit mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default WorkoutSummary;
