import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface Member {
  id: string;
  full_name: string;
  email: string | null;
}

interface WorkoutAssignment {
  id: string;
  assigned_date: string;
  completed_at: string | null;
  workout_template: {
    name: string;
    category: string | null;
  } | null;
}

interface RankPromotion {
  id: string;
  promotion_date: string;
  notes: string | null;
  discipline: { name: string } | null;
  from_rank: { name: string; color: string | null } | null;
  to_rank: { name: string; color: string | null } | null;
}

interface PerformanceRecord {
  id: string;
  exercise_name: string;
  value: number;
  unit: string;
  is_pr: boolean;
  recorded_at: string;
}

export function MemberProgressDashboard() {
  const { currentGym } = useGym();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [assignments, setAssignments] = useState<WorkoutAssignment[]>([]);
  const [promotions, setPromotions] = useState<RankPromotion[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');

  const fetchMembers = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('members')
      .select('id, full_name, email')
      .eq('gym_id', currentGym.id)
      .eq('status', 'active')
      .order('full_name');
    setMembers(data || []);
    setLoading(false);
  };

  const fetchMemberProgress = async () => {
    if (!selectedMember) return;
    setLoading(true);

    let dateFilter = new Date(0);
    if (dateRange === 'week') dateFilter = subDays(new Date(), 7);
    if (dateRange === 'month') dateFilter = startOfMonth(new Date());

    const [assignmentsRes, promotionsRes, performanceRes] = await Promise.all([
      supabase
        .from('member_workouts')
        .select(`
          id,
          assigned_date,
          completed_at,
          workout_template:workout_templates(name, category)
        `)
        .eq('member_id', selectedMember)
        .gte('assigned_date', dateFilter.toISOString().split('T')[0])
        .order('assigned_date', { ascending: false }),
      supabase
        .from('rank_promotions')
        .select(`
          id,
          promotion_date,
          notes,
          discipline:disciplines(name),
          from_rank:discipline_ranks!rank_promotions_from_rank_id_fkey(name, color),
          to_rank:discipline_ranks!rank_promotions_to_rank_id_fkey(name, color)
        `)
        .eq('member_id', selectedMember)
        .order('promotion_date', { ascending: false })
        .limit(10),
      supabase
        .from('performance_records')
        .select('*')
        .eq('member_id', selectedMember)
        .gte('recorded_at', dateFilter.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(50),
    ]);

    setAssignments((assignmentsRes.data || []) as WorkoutAssignment[]);
    setPromotions((promotionsRes.data || []) as RankPromotion[]);
    setPerformanceRecords(performanceRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (currentGym?.id) {
      fetchMembers();
    }
  }, [currentGym?.id]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberProgress();
    }
  }, [selectedMember, dateRange]);

  const completedWorkouts = assignments.filter(a => a.completed_at).length;
  const totalWorkouts = assignments.length;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  const personalRecords = performanceRecords.filter(p => p.is_pr).length;

  const selectedMemberData = members.find(m => m.id === selectedMember);

  if (!currentGym) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Please select a gym first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Member Progress Dashboard
          </CardTitle>
          <CardDescription>Track workout completion, rank progression, and performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as 'week' | 'month' | 'all')}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalWorkouts}</p>
                    <p className="text-sm text-muted-foreground">Assigned</p>
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
                    <p className="text-2xl font-bold">{completedWorkouts}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Rate</p>
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
                    <p className="text-2xl font-bold">{personalRecords}</p>
                    <p className="text-sm text-muted-foreground">PRs</p>
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
                  <span>Workout Completion</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}
          <Tabs defaultValue="workouts">
            <TabsList>
              <TabsTrigger value="workouts">Workouts</TabsTrigger>
              <TabsTrigger value="ranks">Rank History</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="workouts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workout History</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No workouts assigned yet</p>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            {assignment.completed_at ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{assignment.workout_template?.name || 'Unknown Workout'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={assignment.completed_at ? 'default' : 'secondary'}>
                            {assignment.completed_at ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ranks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rank Progression Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {promotions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No rank promotions yet</p>
                  ) : (
                    <div className="relative space-y-4 pl-6 border-l-2 border-muted">
                      {promotions.map((promotion, index) => (
                        <div key={promotion.id} className="relative">
                          <div
                            className="absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background"
                            style={{ backgroundColor: promotion.to_rank?.color || '#3B82F6' }}
                          />
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                style={{
                                  backgroundColor: `${promotion.to_rank?.color}20`,
                                  color: promotion.to_rank?.color,
                                  borderColor: promotion.to_rank?.color,
                                }}
                                variant="outline"
                              >
                                {promotion.to_rank?.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                in {promotion.discipline?.name}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(promotion.promotion_date), 'MMMM d, yyyy')}
                            </p>
                            {promotion.notes && (
                              <p className="text-sm mt-1">{promotion.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceRecords.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No performance records yet</p>
                  ) : (
                    <div className="space-y-3">
                      {performanceRecords.map(record => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            {record.is_pr && <Trophy className="w-5 h-5 text-yellow-500" />}
                            <div>
                              <p className="font-medium">{record.exercise_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(record.recorded_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{record.value} {record.unit}</p>
                            {record.is_pr && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-500">
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
        </>
      )}
    </div>
  );
}
