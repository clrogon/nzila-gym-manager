import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseLibrary } from '@/components/training/ExerciseLibrary';
import { WorkoutTemplateBuilder } from '@/components/training/WorkoutTemplateBuilder';
import { WorkoutAssignment } from '@/components/training/WorkoutAssignment';
import { RankPromotion } from '@/components/training/RankPromotion';
import { PromotionCriteria } from '@/components/training/PromotionCriteria';
import { MemberProgressDashboard } from '@/components/training/MemberProgressDashboard';
import { TrainingLibraryView } from '@/components/training/TrainingLibraryView';
import { GymContentCrud } from '@/components/training/GymContentCrud';
import {
  Dumbbell,
  ClipboardList,
  TrendingUp,
  Award,
  Settings2,
  BookOpen,
  Target,
  ListChecks,
} from 'lucide-react';

export default function Training() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState('exercises');
  const [stats, setStats] = useState({
    exercises: 0,
    templates: 0,
    assignments: 0,
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchStats();
    }
  }, [currentGym?.id]);

  const fetchStats = async () => {
    if (!currentGym?.id) return;
    try {
      const [exercisesRes, templatesRes, assignmentsRes] = await Promise.all([
        supabase
          .from('gym_exercises')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id),
        supabase
          .from('workout_templates')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', currentGym.id),
        supabase
          .from('member_workouts')
          .select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        exercises: exercisesRes.count || 0,
        templates: templatesRes.count || 0,
        assignments: assignmentsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Por favor, selecione um ginásio primeiro.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Centro de Treino</h1>
            <p className="text-muted-foreground">Gerir exercícios, treinos, atribuições e promoções</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ListChecks className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.exercises}</p>
                  <p className="text-sm text-muted-foreground">Exercícios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Dumbbell className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.templates}</p>
                  <p className="text-sm text-muted-foreground">Modelos de Treino</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <ClipboardList className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assignments}</p>
                  <p className="text-sm text-muted-foreground">Atribuições</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Exercícios</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Modelos</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Atribuições</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Promoções</span>
            </TabsTrigger>
            <TabsTrigger value="criteria" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Critérios</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Personalizado</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-6">
            <ExerciseLibrary />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <WorkoutTemplateBuilder />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <WorkoutAssignment />
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <MemberProgressDashboard />
          </TabsContent>

          <TabsContent value="promotions" className="mt-6">
            <RankPromotion />
          </TabsContent>

          <TabsContent value="criteria" className="mt-6">
            <PromotionCriteria />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <TrainingLibraryView />
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <GymContentCrud />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
