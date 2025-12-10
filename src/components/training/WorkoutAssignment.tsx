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
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, Calendar as CalendarIcon, Loader2, CheckCircle2,
  Clock, User, Dumbbell, X, FileText
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
          .select('id, name, category, difficulty, estimated_duration')
          .eq('gym_id', currentGym.id)
          .order('name'),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setAssignments(assignmentsRes.data || []);
      setMembers(membersRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!formData.member_id || !formData.workout_template_id) {
      toast.error('Please select a member and workout');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('member_workouts').insert({
        member_id: formData.member_id,
        workout_template_id: formData.workout_template_id,
        assigned_date: format(formData.assigned_date, 'yyyy-MM-dd'),
        assigned_by: user?.id,
        notes: formData.notes || null,
      });

      if (error) throw error;
      toast.success('Workout assigned successfully');
      setIsAssignDialogOpen(false);
      setFormData({ member_id: '', workout_template_id: '', assigned_date: new Date(), notes: '' });
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

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
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
              <Label>Date</Label>
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
              Assign
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
