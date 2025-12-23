import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, addDays, addWeeks } from 'date-fns';
import {
  Plus, Calendar as CalendarIcon, Loader2, CheckCircle2,
  Clock, User, Dumbbell, Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  full_name: string;
  email: string | null;
  status: string | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  discipline?: { id: string; name: string; is_active: boolean } | null;
}

interface MemberWorkout {
  id: string;
  member_id: string;
  workout_template_id: string | null;
  assigned_date: string;
  completed_at: string | null;
  notes: string | null;
  results: any;
  member?: Member;
  workout_template?: WorkoutTemplate;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'custom';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function WorkoutAssignment() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<MemberWorkout[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MemberWorkout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    member_id: '',
    workout_template_id: '',
    assigned_date: new Date(),
    notes: '',
  });

  const [recurrence, setRecurrence] = useState({
    enabled: false,
    type: 'weekly' as RecurrenceType,
    selectedDays: [1, 3, 5], // Mon, Wed, Fri default
    weeks: 4,
  });

  const [completionData, setCompletionData] = useState({
    results: '',
    notes: '',
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchData();
    }
  }, [currentGym?.id]);

  const fetchData = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const [assignmentsRes, membersRes, templatesRes] = await Promise.all([
        supabase
          .from('member_workouts')
          .select(`
            *,
            member:members(id, full_name, email, status),
            workout_template:workout_templates(id, name, category, difficulty, estimated_duration)
          `)
          .order('assigned_date', { ascending: false })
          .limit(50),
        supabase
          .from('members')
          .select('id, full_name, email, status')
          .eq('gym_id', currentGym.id)
          .eq('status', 'active')
          .order('full_name'),
        supabase
          .from('workout_templates')
          .select('id, name, category, difficulty, estimated_duration, discipline:disciplines(id, name, is_active)')
          .eq('gym_id', currentGym.id)
          .order('name'),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setAssignments(assignmentsRes.data || []);
      setMembers(membersRes.data || []);
      // Filter templates to only show those with active disciplines
      const rawTemplates = (templatesRes.data || []) as any[];
      const activeTemplates = rawTemplates.filter(t => {
        const discipline = Array.isArray(t.discipline) ? t.discipline[0] : t.discipline;
        return !discipline || discipline.is_active !== false;
      }).map(t => ({
        ...t,
        discipline: Array.isArray(t.discipline) ? t.discipline[0] : t.discipline,
      }));
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecurringDates = (): Date[] => {
    const dates: Date[] = [];
    const startDate = formData.assigned_date;

    if (!recurrence.enabled || recurrence.type === 'none') {
      return [startDate];
    }

    if (recurrence.type === 'daily') {
      for (let i = 0; i < recurrence.weeks * 7; i++) {
        dates.push(addDays(startDate, i));
      }
    } else if (recurrence.type === 'weekly' || recurrence.type === 'custom') {
      for (let week = 0; week < recurrence.weeks; week++) {
        for (const dayOfWeek of recurrence.selectedDays) {
          const date = addWeeks(startDate, week);
          const currentDayOfWeek = date.getDay();
          const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
          const targetDate = addDays(date, daysToAdd);
          if (targetDate >= startDate) {
            dates.push(targetDate);
          }
        }
      }
    }

    // Remove duplicates and sort
    const uniqueDates = Array.from(new Set(dates.map(d => d.toISOString())))
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    return uniqueDates;
  };

  const handleAssign = async () => {
    if (!formData.member_id || !formData.workout_template_id) {
      toast.error('Please select a member and workout');
      return;
    }

    setIsSubmitting(true);
    try {
      const dates = generateRecurringDates();
      const assignments = dates.map(date => ({
        member_id: formData.member_id,
        workout_template_id: formData.workout_template_id,
        assigned_date: format(date, 'yyyy-MM-dd'),
        assigned_by: user?.id,
        notes: formData.notes || null,
      }));

      const { error } = await supabase.from('member_workouts').insert(assignments);

      if (error) throw error;
      toast.success(`${assignments.length} workout${assignments.length > 1 ? 's' : ''} assigned successfully`);
      setIsAssignDialogOpen(false);
      setFormData({ member_id: '', workout_template_id: '', assigned_date: new Date(), notes: '' });
      setRecurrence({ enabled: false, type: 'weekly', selectedDays: [1, 3, 5], weeks: 4 });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('member_workouts')
        .update({
          completed_at: new Date().toISOString(),
          results: completionData.results ? { notes: completionData.results } : null,
          notes: completionData.notes || selectedAssignment.notes,
        })
        .eq('id', selectedAssignment.id);

      if (error) throw error;
      toast.success('Workout marked as completed');
      setIsCompleteDialogOpen(false);
      setSelectedAssignment(null);
      setCompletionData({ results: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCompleteDialog = (assignment: MemberWorkout) => {
    setSelectedAssignment(assignment);
    setCompletionData({ results: '', notes: assignment.notes || '' });
    setIsCompleteDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setRecurrence(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort((a, b) => a - b),
    }));
  };

  const pendingAssignments = assignments.filter(a => !a.completed_at);
  const completedAssignments = assignments.filter(a => a.completed_at);

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Workout Assignments</h2>
          <p className="text-sm text-muted-foreground">Assign workouts to members and track progress</p>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Workout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
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
                <p className="text-2xl font-bold">{completedAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Workouts</CardTitle>
          <CardDescription>Workouts waiting to be completed</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAssignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending workouts</p>
          ) : (
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.member?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.workout_template?.name || 'Custom Workout'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="outline">{assignment.workout_template?.difficulty || 'N/A'}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(assignment.assigned_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openCompleteDialog(assignment)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Workouts</CardTitle>
            <CardDescription>Recently completed workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedAssignments.slice(0, 10).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.member?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.workout_template?.name || 'Custom Workout'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.completed_at && format(new Date(assignment.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Dialog with Recurrence */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={formData.member_id} onValueChange={(v) => setFormData(prev => ({ ...prev, member_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Workout Template</Label>
              <Select value={formData.workout_template_id} onValueChange={(v) => setFormData(prev => ({ ...prev, workout_template_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workout" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.difficulty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.assigned_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.assigned_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, assigned_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Recurring Assignment */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-muted-foreground" />
                  <Label>Recurring Assignment</Label>
                </div>
                <Switch
                  checked={recurrence.enabled}
                  onCheckedChange={(checked) => setRecurrence(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {recurrence.enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Days of Week</Label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={recurrence.selectedDays.includes(day.value) ? 'default' : 'outline'}
                          className="w-10 h-10 p-0"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Duration (weeks)</Label>
                    <Select 
                      value={String(recurrence.weeks)} 
                      onValueChange={(v) => setRecurrence(prev => ({ ...prev, weeks: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4, 6, 8, 12].map((w) => (
                          <SelectItem key={w} value={String(w)}>{w} week{w > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This will create {generateRecurringDates().length} workout assignments
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign {recurrence.enabled ? `(${generateRecurringDates().length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium">{selectedAssignment?.member?.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedAssignment?.workout_template?.name}</p>
            </div>

            <div className="space-y-2">
              <Label>Results / Performance Notes</Label>
              <Textarea
                value={completionData.results}
                onChange={(e) => setCompletionData(prev => ({ ...prev, results: e.target.value }))}
                placeholder="e.g., Completed all sets, PR on deadlift..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={completionData.notes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any other observations..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
