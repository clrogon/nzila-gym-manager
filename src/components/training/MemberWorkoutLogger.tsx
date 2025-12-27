import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format, isToday, isFuture, isPast } from 'date-fns';
import {
  Dumbbell, CheckCircle2, Clock, Play, Trophy, ChevronRight,
  Loader2, Calendar, Target, Flame, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  exercises: WorkoutExercise[];
}

interface MemberWorkout {
  id: string;
  member_id: string;
  workout_template_id: string | null;
  assigned_date: string;
  completed_at: string | null;
  notes: string | null;
  results: ExerciseResults | null;
  workout_template: WorkoutTemplate | null;
}

interface ExerciseResult {
  exercise_id: string;
  exercise_name: string;
  sets_completed: SetResult[];
}

interface SetResult {
  set_number: number;
  reps: number;
  weight: number;
  time_seconds?: number;
  notes?: string;
}

interface ExerciseResults {
  exercises: ExerciseResult[];
  total_time_minutes?: number;
  notes?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function MemberWorkoutLogger() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [workouts, setWorkouts] = useState<MemberWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<MemberWorkout | null>(null);
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (user?.id && currentGym?.id) {
      fetchMemberWorkouts();
    }
  }, [user?.id, currentGym?.id]);

  const fetchMemberWorkouts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // First get member ID for this user
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym?.id)
        .single();

      if (!memberData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('member_workouts')
        .select(`
          *,
          workout_template:workout_templates(
            id, name, description, category, difficulty, estimated_duration, exercises
          )
        `)
        .eq('member_id', memberData.id)
        .order('assigned_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      const typedWorkouts = (data || []).map(w => {
        const template = w.workout_template as {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          difficulty: string | null;
          estimated_duration: number | null;
          exercises: unknown;
        } | null;
        
        return {
          id: w.id,
          member_id: w.member_id,
          workout_template_id: w.workout_template_id,
          assigned_date: w.assigned_date,
          completed_at: w.completed_at,
          notes: w.notes,
          results: w.results as unknown as ExerciseResults | null,
          workout_template: template ? {
            ...template,
            exercises: Array.isArray(template.exercises) 
              ? template.exercises as WorkoutExercise[]
              : []
          } : null
        };
      });

      setWorkouts(typedWorkouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast.error('Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  };

  const openLoggingDialog = (workout: MemberWorkout) => {
    setSelectedWorkout(workout);
    setStartTime(new Date());
    
    // Initialize exercise results from template
    const template = workout.workout_template;
    if (template?.exercises) {
      const initialResults: ExerciseResult[] = template.exercises.map(ex => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets_completed: Array.from({ length: ex.sets }, (_, i) => ({
          set_number: i + 1,
          reps: parseInt(ex.reps) || 0,
          weight: 0,
        })),
      }));
      setExerciseResults(initialResults);
    }
    
    // Load previous results if exists
    if (workout.results) {
      const prevResults = workout.results as ExerciseResults;
      if (prevResults.exercises) {
        setExerciseResults(prevResults.exercises);
      }
      if (prevResults.notes) {
        setWorkoutNotes(prevResults.notes);
      }
    }
    
    setIsLoggingOpen(true);
  };

  const updateSetResult = (
    exerciseIdx: number, 
    setIdx: number, 
    field: keyof SetResult, 
    value: number | string
  ) => {
    setExerciseResults(prev => {
      const updated = [...prev];
      updated[exerciseIdx] = {
        ...updated[exerciseIdx],
        sets_completed: updated[exerciseIdx].sets_completed.map((set, i) => 
          i === setIdx ? { ...set, [field]: value } : set
        ),
      };
      return updated;
    });
  };

  const handleSaveWorkout = async (markComplete: boolean) => {
    if (!selectedWorkout) return;
    
    setIsSubmitting(true);
    try {
      const endTime = new Date();
      const totalMinutes = startTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
        : undefined;

      const results: ExerciseResults = {
        exercises: exerciseResults,
        total_time_minutes: totalMinutes,
        notes: workoutNotes,
      };

      const updateData: Record<string, unknown> = {
        results: results as unknown,
        notes: workoutNotes || selectedWorkout.notes,
      };

      if (markComplete) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('member_workouts')
        .update(updateData)
        .eq('id', selectedWorkout.id);

      if (error) throw error;

      // Check for PRs and save to performance_records
      if (markComplete) {
        await checkAndSavePersonalRecords(selectedWorkout.member_id, exerciseResults);
      }

      toast.success(markComplete ? 'Treino concluído! 💪' : 'Progresso guardado');
      setIsLoggingOpen(false);
      setSelectedWorkout(null);
      setExerciseResults([]);
      setWorkoutNotes('');
      fetchMemberWorkouts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao guardar treino';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAndSavePersonalRecords = async (memberId: string, results: ExerciseResult[]) => {
    if (!currentGym?.id) return;

    for (const exercise of results) {
      // Find max weight for this exercise
      const maxWeight = Math.max(...exercise.sets_completed.map(s => s.weight || 0));
      if (maxWeight <= 0) continue;

      // Check if this is a new PR
      const { data: existingPR } = await supabase
        .from('performance_records')
        .select('value')
        .eq('member_id', memberId)
        .eq('exercise_name', exercise.exercise_name)
        .eq('unit', 'kg')
        .order('value', { ascending: false })
        .limit(1)
        .single();

      const isPR = !existingPR || maxWeight > existingPR.value;

      // Save performance record
      await supabase.from('performance_records').insert({
        member_id: memberId,
        gym_id: currentGym.id,
        exercise_name: exercise.exercise_name,
        value: maxWeight,
        unit: 'kg',
        is_pr: isPR,
      });

      if (isPR) {
        toast.success(`🏆 Novo recorde pessoal em ${exercise.exercise_name}: ${maxWeight}kg!`);
      }
    }
  };

  const todayWorkouts = workouts.filter(w => isToday(new Date(w.assigned_date)) && !w.completed_at);
  const upcomingWorkouts = workouts.filter(w => isFuture(new Date(w.assigned_date)));
  const completedWorkouts = workouts.filter(w => w.completed_at);
  const pendingWorkouts = workouts.filter(w => !w.completed_at && isPast(new Date(w.assigned_date)) && !isToday(new Date(w.assigned_date)));

  const completionRate = workouts.length > 0 
    ? Math.round((completedWorkouts.length / workouts.length) * 100) 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayWorkouts.length}</p>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedWorkouts.length}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Flame className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingWorkouts.length}</p>
                <p className="text-sm text-muted-foreground">Próximos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso de Treinos</span>
              <span className="font-medium">{completedWorkouts.length}/{workouts.length}</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Workouts */}
      {todayWorkouts.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Treinos de Hoje
            </CardTitle>
            <CardDescription>Pronto para treinar?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayWorkouts.map(workout => (
                <WorkoutCard 
                  key={workout.id} 
                  workout={workout} 
                  onStart={() => openLoggingDialog(workout)}
                  isPrimary
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Workouts */}
      {pendingWorkouts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Treinos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWorkouts.map(workout => (
                <WorkoutCard 
                  key={workout.id} 
                  workout={workout} 
                  onStart={() => openLoggingDialog(workout)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Workouts */}
      {upcomingWorkouts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Próximos Treinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingWorkouts.slice(0, 5).map(workout => (
                <WorkoutCard 
                  key={workout.id} 
                  workout={workout}
                  isUpcoming
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Workouts */}
      {completedWorkouts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Treinos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedWorkouts.slice(0, 5).map(workout => (
                <WorkoutCard 
                  key={workout.id} 
                  workout={workout}
                  isCompleted
                  onView={() => openLoggingDialog(workout)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {workouts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum treino atribuído ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Os teus treinadores vão atribuir treinos para ti
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workout Logging Dialog */}
      <Dialog open={isLoggingOpen} onOpenChange={setIsLoggingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              {selectedWorkout?.workout_template?.name || 'Registar Treino'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Workout Info */}
              {selectedWorkout?.workout_template && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedWorkout.workout_template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedWorkout.workout_template.exercises?.length || 0} exercícios • 
                      ~{selectedWorkout.workout_template.estimated_duration}min
                    </p>
                  </div>
                  {selectedWorkout.workout_template.difficulty && (
                    <Badge className={DIFFICULTY_COLORS[selectedWorkout.workout_template.difficulty]}>
                      {selectedWorkout.workout_template.difficulty}
                    </Badge>
                  )}
                </div>
              )}

              {/* Exercise Logging */}
              {exerciseResults.map((exercise, exIdx) => (
                <Card key={exercise.exercise_id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{exercise.exercise_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                        <span>Série</span>
                        <span>Peso (kg)</span>
                        <span>Reps</span>
                        <span>Tempo (s)</span>
                      </div>
                      
                      {/* Set Rows */}
                      {exercise.sets_completed.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2">
                          <div className="flex items-center">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                              {set.set_number}
                            </Badge>
                          </div>
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.weight || ''}
                            onChange={(e) => updateSetResult(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.reps || ''}
                            onChange={(e) => updateSetResult(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            placeholder="-"
                            value={set.time_seconds || ''}
                            onChange={(e) => updateSetResult(exIdx, setIdx, 'time_seconds', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notas do Treino</Label>
                <Textarea
                  placeholder="Como te sentiste? Alguma observação..."
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleSaveWorkout(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Progresso
            </Button>
            <Button
              onClick={() => handleSaveWorkout(true)}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Concluir Treino
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workout Card Component
interface WorkoutCardProps {
  workout: MemberWorkout;
  onStart?: () => void;
  onView?: () => void;
  isPrimary?: boolean;
  isUpcoming?: boolean;
  isCompleted?: boolean;
}

function WorkoutCard({ workout, onStart, onView, isPrimary, isUpcoming, isCompleted }: WorkoutCardProps) {
  const template = workout.workout_template;
  
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border transition-colors",
      isPrimary && "bg-primary/5 border-primary/30",
      isCompleted && "bg-muted/50"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-full",
          isCompleted ? "bg-green-500/10" : isPrimary ? "bg-primary/10" : "bg-muted"
        )}>
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Dumbbell className={cn("w-5 h-5", isPrimary ? "text-primary" : "text-muted-foreground")} />
          )}
        </div>
        <div>
          <p className="font-medium">{template?.name || 'Treino'}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(workout.assigned_date), 'dd MMM yyyy')}</span>
            {template?.estimated_duration && (
              <>
                <span>•</span>
                <span>{template.estimated_duration}min</span>
              </>
            )}
            {template?.difficulty && (
              <>
                <span>•</span>
                <Badge variant="outline" className={cn("text-xs", DIFFICULTY_COLORS[template.difficulty])}>
                  {template.difficulty}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      
      {!isUpcoming && (
        <Button 
          size="sm" 
          variant={isPrimary ? "default" : "outline"}
          onClick={isCompleted ? onView : onStart}
        >
          {isCompleted ? (
            <>Ver<ChevronRight className="w-4 h-4 ml-1" /></>
          ) : (
            <><Play className="w-4 h-4 mr-1" />Iniciar</>
          )}
        </Button>
      )}
    </div>
  );
}
