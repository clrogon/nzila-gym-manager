import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronLeft,
  Clock,
  Flame,
  Heart,
  Dumbbell,
  CheckCircle2,
  Timer,
  Activity,
  Zap,
  Award,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  name: string;
  duration?: number;
  reps?: number;
  sets?: number;
  rest?: number;
}

interface WorkoutSession {
  id: string;
  workout_name: string;
  exercises: Exercise[];
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
}

export function WorkoutPlayer() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { user } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [heartRate, setHeartRate] = useState(72);

  // Fetch workout details
  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout-session', workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      
      const { data, error } = await supabase
        .from('member_workouts')
        .select(`
          id,
          workout_template:workout_templates(
            name,
            exercises,
            category,
            difficulty,
            estimated_duration
          )
        `)
        .eq('id', workoutId)
        .maybeSingle();
      
      if (error) throw error;
      
      const template = data?.workout_template as any;
      return {
        id: data?.id || workoutId,
        workout_name: template?.name || 'Treino',
        exercises: Array.isArray(template?.exercises) ? template.exercises : [
          { name: 'Aquecimento', duration: 300 },
          { name: 'Agachamento', sets: 4, reps: 12, rest: 60 },
          { name: 'Supino', sets: 4, reps: 10, rest: 60 },
          { name: 'Remada', sets: 3, reps: 12, rest: 60 },
          { name: 'Alongamento', duration: 300 },
        ],
        category: template?.category || 'Geral',
        difficulty: template?.difficulty || 'Intermédio',
        estimated_duration: template?.estimated_duration || 45,
      } as WorkoutSession;
    },
    enabled: !!workoutId,
    staleTime: 10 * 60 * 1000,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        // Simulate calorie burn (approx 8-12 cal/min for moderate workout)
        setCaloriesBurned(prev => prev + 0.15);
        // Simulate heart rate variation
        setHeartRate(prev => {
          const variation = (Math.random() - 0.5) * 4;
          return Math.max(90, Math.min(165, prev + variation));
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Complete workout mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!workoutId) return;
      
      const { error } = await supabase
        .from('member_workouts')
        .update({ 
          completed_at: new Date().toISOString(),
          results: {
            duration_seconds: elapsedTime,
            calories_burned: Math.round(caloriesBurned),
            avg_heart_rate: Math.round(heartRate),
          }
        })
        .eq('id', workoutId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member_workouts'] });
      navigate(`/member/workout/${workoutId}/summary`, {
        state: {
          duration: elapsedTime,
          calories: Math.round(caloriesBurned),
          heartRate: Math.round(heartRate),
          exercisesCompleted: workout?.exercises?.length || 0,
        }
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível guardar o treino.',
        variant: 'destructive'
      });
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = workout?.exercises?.[currentExerciseIndex];
  const progress = workout?.exercises?.length 
    ? ((currentExerciseIndex + 1) / workout.exercises.length) * 100 
    : 0;

  const handleNext = () => {
    if (workout?.exercises && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsPlaying(false);
    completeMutation.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-[60vh]" />
          <Skeleton className="h-32" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        {/* Main Player Area */}
        <Card className="glass border-white/10 overflow-hidden">
          {/* Video/Exercise Display */}
          <div className="relative aspect-video bg-gradient-to-br from-card via-background to-primary/10 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
            
            {/* Live Stats Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="flex gap-3">
                <Badge className="glass bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5">
                  <Heart className="w-4 h-4 mr-1 text-red-500" />
                  {Math.round(heartRate)} BPM
                </Badge>
                <Badge className="glass bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  {Math.round(caloriesBurned)} kcal
                </Badge>
              </div>
              <Badge className="glass bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5">
                <Timer className="w-4 h-4 mr-1 text-primary" />
                {formatTime(elapsedTime)}
              </Badge>
            </div>

            {/* Current Exercise Display */}
            <div className="text-center z-10">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                Exercício {currentExerciseIndex + 1} de {workout?.exercises?.length || 0}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                {currentExercise?.name || 'Preparar'}
              </h2>
              <div className="flex items-center justify-center gap-6 text-muted-foreground">
                {currentExercise?.sets && (
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    {currentExercise.sets} séries
                  </span>
                )}
                {currentExercise?.reps && (
                  <span className="flex items-center gap-1">
                    <Target className="w-5 h-5 text-primary" />
                    {currentExercise.reps} repetições
                  </span>
                )}
                {currentExercise?.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-5 h-5 text-primary" />
                    {Math.floor(currentExercise.duration / 60)} min
                  </span>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                onClick={handlePrev}
                disabled={currentExerciseIndex === 0}
              >
                <SkipBack className="w-6 h-6" />
              </Button>
              
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                onClick={handleNext}
                disabled={!workout?.exercises || currentExerciseIndex >= workout.exercises.length - 1}
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 bg-card/50">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{workout?.workout_name}</span>
              <span>{Math.round(progress)}% completo</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

        {/* Exercise Timeline */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Linha do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {workout?.exercises?.map((exercise, index) => {
                const isActive = index === currentExerciseIndex;
                const isCompleted = index < currentExerciseIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentExerciseIndex(index)}
                    className={`
                      flex-shrink-0 p-3 rounded-xl border transition-all min-w-[120px]
                      ${isActive 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : isCompleted
                          ? 'bg-success/20 border-success/50 text-success'
                          : 'bg-white/5 border-white/10 hover:border-primary/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                      )}
                      <span className="text-xs font-medium truncate">{exercise.name}</span>
                    </div>
                    {exercise.sets && (
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets}x{exercise.reps}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Complete Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-brand-accent text-primary-foreground px-8"
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            <Award className="w-5 h-5 mr-2" />
            {completeMutation.isPending ? 'A Guardar...' : 'Concluir Treino'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WorkoutPlayer;
