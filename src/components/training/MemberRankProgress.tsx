import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Award, TrendingUp, Target, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DisciplineRank {
  id: string;
  name: string;
  level: number;
  color: string | null;
}

interface Discipline {
  id: string;
  name: string;
  category: string | null;
}

interface MemberRank {
  id: string;
  discipline_id: string;
  rank_id: string;
  awarded_at: string;
  discipline: Discipline | null;
  rank: DisciplineRank | null;
}

interface PromotionCriteria {
  id: string;
  discipline_id: string;
  from_rank_id: string | null;
  to_rank_id: string;
  min_classes: number | null;
  min_months: number | null;
  min_attendance_percent: number | null;
  requirements: string | null;
  to_rank: DisciplineRank | null;
}

interface RankProgressData {
  discipline: Discipline;
  currentRank: DisciplineRank | null;
  nextRank: DisciplineRank | null;
  criteria: PromotionCriteria | null;
  progress: {
    classesAttended: number;
    monthsInRank: number;
    attendancePercent: number;
    workoutsCompleted: number;
  };
  eligibleForPromotion: boolean;
}

export function MemberRankProgress() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(true);
  const [memberRanks, setMemberRanks] = useState<MemberRank[]>([]);
  const [progressData, setProgressData] = useState<RankProgressData[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && currentGym?.id) {
      fetchMemberData();
    }
  }, [user?.id, currentGym?.id]);

  const fetchMemberData = async () => {
    if (!user?.id || !currentGym?.id) return;
    setLoading(true);

    try {
      // Get member ID
      const { data: memberData } = await supabase
        .from('members')
        .select('id, membership_start_date')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .single();

      if (!memberData) {
        setLoading(false);
        return;
      }

      setMemberId(memberData.id);

      // Fetch member ranks
      const { data: ranksData } = await supabase
        .from('member_ranks')
        .select(`
          *,
          discipline:disciplines(id, name, category),
          rank:discipline_ranks(id, name, level, color)
        `)
        .eq('member_id', memberData.id);

      setMemberRanks(ranksData || []);

      // Fetch all disciplines for the gym
      const { data: disciplines } = await supabase
        .from('disciplines')
        .select('id, name, category')
        .eq('gym_id', currentGym.id)
        .eq('is_active', true);

      // Fetch promotion criteria
      const { data: allCriteria } = await supabase
        .from('promotion_criteria')
        .select(`
          *,
          to_rank:discipline_ranks!promotion_criteria_to_rank_id_fkey(id, name, level, color)
        `);

      // Fetch attendance data (class bookings)
      const { data: bookings } = await supabase
        .from('class_bookings')
        .select(`
          id, 
          checked_in_at,
          class:classes(discipline_id, start_time)
        `)
        .eq('member_id', memberData.id)
        .not('checked_in_at', 'is', null);

      // Fetch completed workouts
      const { data: workouts } = await supabase
        .from('member_workouts')
        .select('id, completed_at')
        .eq('member_id', memberData.id)
        .not('completed_at', 'is', null);

      // Calculate progress for each discipline
      const progress: RankProgressData[] = (disciplines || []).map(discipline => {
        const currentMemberRank = (ranksData || []).find(r => r.discipline_id === discipline.id);
        const currentRank = currentMemberRank?.rank || null;
        
        // Find next rank
        const nextCriteria = (allCriteria || []).find(c => 
          c.discipline_id === discipline.id && 
          c.from_rank_id === (currentRank?.id || null)
        );

        // Calculate attendance for this discipline
        const disciplineBookings = (bookings || []).filter(
          b => b.class?.discipline_id === discipline.id
        );
        const classesAttended = disciplineBookings.length;

        // Calculate months in current rank
        const rankStartDate = currentMemberRank?.awarded_at 
          ? new Date(currentMemberRank.awarded_at) 
          : new Date(memberData.membership_start_date || Date.now());
        const monthsInRank = Math.floor(
          (Date.now() - rankStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        // Calculate attendance percentage (simplified - based on last 30 days)
        const attendancePercent = classesAttended > 0 ? Math.min(100, classesAttended * 10) : 0;

        // Workouts completed
        const workoutsCompleted = (workouts || []).length;

        // Check eligibility
        let eligibleForPromotion = false;
        if (nextCriteria) {
          const meetsClasses = !nextCriteria.min_classes || classesAttended >= nextCriteria.min_classes;
          const meetsMonths = !nextCriteria.min_months || monthsInRank >= nextCriteria.min_months;
          const meetsAttendance = !nextCriteria.min_attendance_percent || 
            attendancePercent >= nextCriteria.min_attendance_percent;
          eligibleForPromotion = meetsClasses && meetsMonths && meetsAttendance;
        }

        return {
          discipline,
          currentRank,
          nextRank: nextCriteria?.to_rank || null,
          criteria: nextCriteria || null,
          progress: {
            classesAttended,
            monthsInRank,
            attendancePercent,
            workoutsCompleted,
          },
          eligibleForPromotion,
        };
      });

      setProgressData(progress);
    } catch (error) {
      console.error('Error fetching rank progress:', error);
      toast.error('Erro ao carregar progresso');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma disciplina disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            O Meu Progresso de Graduação
          </CardTitle>
          <CardDescription>
            Acompanha o teu progresso em cada disciplina
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Cards */}
      {progressData.map((data) => (
        <RankProgressCard key={data.discipline.id} data={data} />
      ))}
    </div>
  );
}

function RankProgressCard({ data }: { data: RankProgressData }) {
  const { discipline, currentRank, nextRank, criteria, progress, eligibleForPromotion } = data;

  // Calculate overall progress percentage
  let overallProgress = 0;
  let progressItems = 0;

  if (criteria) {
    if (criteria.min_classes) {
      overallProgress += Math.min(100, (progress.classesAttended / criteria.min_classes) * 100);
      progressItems++;
    }
    if (criteria.min_months) {
      overallProgress += Math.min(100, (progress.monthsInRank / criteria.min_months) * 100);
      progressItems++;
    }
    if (criteria.min_attendance_percent) {
      overallProgress += Math.min(100, (progress.attendancePercent / criteria.min_attendance_percent) * 100);
      progressItems++;
    }
  }

  const avgProgress = progressItems > 0 ? Math.round(overallProgress / progressItems) : 0;

  return (
    <Card className={eligibleForPromotion ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{discipline.name}</CardTitle>
            <CardDescription>{discipline.category}</CardDescription>
          </div>
          {eligibleForPromotion && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Elegível para Promoção
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current & Next Rank */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Graduação Atual</p>
            {currentRank ? (
              <Badge 
                variant="outline" 
                className="text-base py-1 px-3"
                style={{
                  backgroundColor: currentRank.color ? `${currentRank.color}20` : undefined,
                  color: currentRank.color || undefined,
                  borderColor: currentRank.color ? `${currentRank.color}50` : undefined,
                }}
              >
                {currentRank.name}
              </Badge>
            ) : (
              <Badge variant="secondary">Iniciante</Badge>
            )}
          </div>
          
          {nextRank && (
            <>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Próxima Graduação</p>
                <Badge 
                  variant="outline" 
                  className="text-base py-1 px-3"
                  style={{
                    backgroundColor: nextRank.color ? `${nextRank.color}20` : undefined,
                    color: nextRank.color || undefined,
                    borderColor: nextRank.color ? `${nextRank.color}50` : undefined,
                  }}
                >
                  {nextRank.name}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {criteria && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para próxima graduação</span>
              <span className="font-medium">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} className="h-2" />
          </div>
        )}

        {/* Criteria Progress */}
        {criteria && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {criteria.min_classes && (
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Aulas</span>
                </div>
                <p className="text-lg font-bold">
                  {progress.classesAttended}/{criteria.min_classes}
                </p>
                <Progress 
                  value={Math.min(100, (progress.classesAttended / criteria.min_classes) * 100)} 
                  className="h-1 mt-1" 
                />
              </div>
            )}
            
            {criteria.min_months && (
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Meses</span>
                </div>
                <p className="text-lg font-bold">
                  {progress.monthsInRank}/{criteria.min_months}
                </p>
                <Progress 
                  value={Math.min(100, (progress.monthsInRank / criteria.min_months) * 100)} 
                  className="h-1 mt-1" 
                />
              </div>
            )}
            
            {criteria.min_attendance_percent && (
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Assiduidade</span>
                </div>
                <p className="text-lg font-bold">
                  {progress.attendancePercent}%
                </p>
                <Progress 
                  value={Math.min(100, (progress.attendancePercent / criteria.min_attendance_percent) * 100)} 
                  className="h-1 mt-1" 
                />
              </div>
            )}
          </div>
        )}

        {/* Requirements */}
        {criteria?.requirements && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Requisitos Adicionais</p>
            <p className="text-sm">{criteria.requirements}</p>
          </div>
        )}

        {/* No Next Rank */}
        {!nextRank && currentRank && (
          <div className="text-center py-4 text-muted-foreground">
            <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm">Parabéns! Atingiste a graduação máxima nesta disciplina.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
