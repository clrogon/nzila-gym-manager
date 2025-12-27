import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutAssignment } from '@/components/training/WorkoutAssignment';
import { RankPromotion } from '@/components/training/RankPromotion';
import { PromotionCriteria } from '@/components/training/PromotionCriteria';
import { MemberProgressDashboard } from '@/components/training/MemberProgressDashboard';
import { TrainingLibraryView } from '@/components/training/TrainingLibraryView';
import { GymContentCrud } from '@/components/training/GymContentCrud';
import { MemberWorkoutLogger } from '@/components/training/MemberWorkoutLogger';
import { MemberRankProgress } from '@/components/training/MemberRankProgress';
import {
  Dumbbell,
  ClipboardList,
  TrendingUp,
  Award,
  Settings2,
  BookOpen,
  Target,
  ListChecks,
  User,
} from 'lucide-react';

export default function Training() {
  const { currentGym } = useGym();
  const { isStaff, isAdmin, isGymOwner, isSuperAdmin } = useRBAC();
  const [activeTab, setActiveTab] = useState('my-workouts');
  const [stats, setStats] = useState({
    exercises: 0,
    templates: 0,
    assignments: 0,
  });

  const isStaffOrAbove = isStaff || isAdmin || isGymOwner || isSuperAdmin;

  useEffect(() => {
    if (currentGym?.id) {
      fetchStats();
    }
  }, [currentGym?.id]);

  // Set default tab based on role
  useEffect(() => {
    if (isStaffOrAbove) {
      setActiveTab('library');
    } else {
      setActiveTab('my-workouts');
    }
  }, [isStaffOrAbove]);

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
            <p className="text-muted-foreground">
              {isStaffOrAbove 
                ? 'Gerir exercícios, treinos, atribuições e promoções'
                : 'Os teus treinos e progresso'
              }
            </p>
          </div>
        </div>

        {/* Quick Stats - Only for staff */}
        {isStaffOrAbove && (
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
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isStaffOrAbove ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-2'}`}>
            {/* Member-facing tabs - Always visible */}
            <TabsTrigger value="my-workouts" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Treinos</span>
            </TabsTrigger>
            <TabsTrigger value="my-progress" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Meu Progresso</span>
            </TabsTrigger>

            {/* Staff/Admin tabs */}
            {isStaffOrAbove && (
              <>
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Biblioteca</span>
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Atribuições</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Membros</span>
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Promoções</span>
                </TabsTrigger>
                <TabsTrigger value="criteria" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Critérios</span>
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Personalizado</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Member-facing content */}
          <TabsContent value="my-workouts" className="mt-6">
            <MemberWorkoutLogger />
          </TabsContent>

          <TabsContent value="my-progress" className="mt-6">
            <MemberRankProgress />
          </TabsContent>

          {/* Staff/Admin content */}
          {isStaffOrAbove && (
            <>
              <TabsContent value="library" className="mt-6">
                <TrainingLibraryView />
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

              <TabsContent value="custom" className="mt-6">
                <GymContentCrud />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
