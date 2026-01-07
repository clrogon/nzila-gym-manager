import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Clock, MapPin, Users, User, CheckCircle, XCircle, UserPlus, 
  Dumbbell, Edit2, Save, Loader2 
} from 'lucide-react';
import { DisciplineStatusBadge } from '@/components/common/DisciplineStatusBadge';
import { supabase } from '@/integrations/supabase/client';

interface ClassEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  discipline_id?: string | null;
  workout_template_id?: string | null;
  coach_id?: string | null;
  location_id?: string | null;
  class_type?: { name: string; color: string } | null;
  location?: { name: string } | null;
  discipline?: { id: string; name: string; is_active: boolean } | null;
}

interface Booking {
  id: string;
  member_id: string;
  status: string;
  booked_at: string;
  checked_in_at: string | null;
  member?: { full_name: string; email: string | null } | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  exercises: WorkoutExercise[] | null;
}

interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string;
  notes?: string;
}

interface Props {
  classEvent: ClassEvent | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ClassDetailDialog({ classEvent, open, onClose, onRefresh }: Props) {
  const { currentGym } = useGym();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    capacity: 20,
    workout_template_id: '',
  });

  useEffect(() => {
    if (open && classEvent) {
      fetchBookings();
      fetchMembers();
      fetchWorkoutTemplate();
      fetchAllWorkoutTemplates();
      setEditForm({
        title: classEvent.title,
        description: classEvent.description || '',
        capacity: classEvent.capacity,
        workout_template_id: classEvent.workout_template_id || '',
      });
    }
  }, [open, classEvent?.id]);

  const fetchBookings = async () => {
    if (!classEvent) return;
    const { data } = await supabase
      .from('class_bookings')
      .select('*, member:members(full_name, email)')
      .eq('class_id', classEvent.id)
      .order('booked_at');
    setBookings(data || []);
  };

  const fetchMembers = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('gym_id', currentGym.id)
      .eq('status', 'active');
    setMembers(data || []);
  };

  const fetchWorkoutTemplate = async () => {
    if (!classEvent?.workout_template_id) {
      setWorkoutTemplate(null);
      return;
    }
    const { data } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', classEvent.workout_template_id)
      .maybeSingle();
    
    if (data) {
      setWorkoutTemplate({
        ...data,
        exercises: Array.isArray(data.exercises) ? (data.exercises as unknown as WorkoutExercise[]) : null,
      });
    } else {
      setWorkoutTemplate(null);
    }
  };

  const fetchAllWorkoutTemplates = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('workout_templates')
      .select('id, name, description, category, difficulty, estimated_duration, exercises')
      .eq('gym_id', currentGym.id)
      .order('name');
    setWorkoutTemplates(data?.map(t => ({
      ...t,
      exercises: Array.isArray(t.exercises) ? (t.exercises as unknown as WorkoutExercise[]) : null,
    })) || []);
  };

  const confirmedBookings = bookings.filter(b => b.status === 'booked' || b.status === 'confirmed');
  const waitlistBookings = bookings.filter(b => b.status === 'waitlist');

  const handleAddBooking = async (memberId: string) => {
    if (!classEvent) return;
    setLoading(true);
    try {
      const isWaitlist = confirmedBookings.length >= classEvent.capacity;
      const { error } = await supabase.from('class_bookings').insert({
        class_id: classEvent.id,
        member_id: memberId,
        status: isWaitlist ? 'waitlist' : 'booked',
      });
      if (error) throw error;
      toast.success(isWaitlist ? 'Added to waitlist' : 'Booking confirmed');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ checked_in_at: new Date().toISOString(), status: 'confirmed' })
        .eq('id', bookingId);
      if (error) throw error;
      toast.success('Checked in');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      
      if (waitlistBookings.length > 0) {
        await supabase
          .from('class_bookings')
          .update({ status: 'booked' })
          .eq('id', waitlistBookings[0].id);
        toast.success('Booking cancelled. Next waitlist member promoted.');
      } else {
        toast.success('Booking cancelled');
      }
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelClass = async () => {
    if (!classEvent) return;
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'cancelled' })
        .eq('id', classEvent.id);
      if (error) throw error;
      toast.success('Class cancelled');
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!classEvent) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          title: editForm.title,
          description: editForm.description || null,
          capacity: editForm.capacity,
          workout_template_id: editForm.workout_template_id || null,
        })
        .eq('id', classEvent.id);
      
      if (error) throw error;
      toast.success('Class updated successfully');
      setIsEditing(false);
      onRefresh();
      
      // Refresh workout template display
      if (editForm.workout_template_id) {
        const selected = workoutTemplates.find(t => t.id === editForm.workout_template_id);
        setWorkoutTemplate(selected || null);
      } else {
        setWorkoutTemplate(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update class');
    } finally {
      setSaving(false);
    }
  };

  if (!classEvent) return null;

  const availableMembersForBooking = members.filter(
    m => !bookings.some(b => b.member_id === m.id && b.status !== 'cancelled')
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: classEvent.class_type?.color || '#3B82F6' }}
            />
            {classEvent.title}
            {classEvent.status === 'cancelled' && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            {classEvent.is_recurring && (
              <Badge variant="secondary">Recurring</Badge>
            )}
            {classEvent.discipline && (
              <DisciplineStatusBadge isActive={classEvent.discipline.is_active} size="sm" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {format(parseISO(classEvent.start_time), 'PPP p')} -{' '}
              {format(parseISO(classEvent.end_time), 'p')}
            </div>
            {classEvent.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {classEvent.location.name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={confirmedBookings.length >= classEvent.capacity ? 'text-destructive' : ''}>
                {confirmedBookings.length}/{classEvent.capacity} booked
              </span>
              {waitlistBookings.length > 0 && (
                <Badge variant="outline">{waitlistBookings.length} waitlist</Badge>
              )}
            </div>
          </div>

          {classEvent.description && (
            <p className="text-sm text-muted-foreground">{classEvent.description}</p>
          )}

          <Tabs defaultValue="bookings">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bookings">
                Bookings ({confirmedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="waitlist">
                Waitlist ({waitlistBookings.length})
              </TabsTrigger>
              <TabsTrigger value="workout">
                <Dumbbell className="w-4 h-4 mr-1" />
                Workout
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="add">Add Member</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <ScrollArea className="h-[300px]">
                {confirmedBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {confirmedBookings.map(booking => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{booking.member?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Booked {format(parseISO(booking.booked_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.checked_in_at ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleCheckIn(booking.id)}>
                              Check In
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="waitlist">
              <ScrollArea className="h-[300px]">
                {waitlistBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No waitlist
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waitlistBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{booking.member?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {format(parseISO(booking.booked_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="workout">
              <ScrollArea className="h-[300px]">
                {workoutTemplate ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-primary" />
                        {workoutTemplate.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        {workoutTemplate.difficulty && (
                          <Badge variant="outline">{workoutTemplate.difficulty}</Badge>
                        )}
                        {workoutTemplate.category && (
                          <Badge variant="secondary">{workoutTemplate.category}</Badge>
                        )}
                        {workoutTemplate.estimated_duration && (
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {workoutTemplate.estimated_duration} min
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workoutTemplate.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {workoutTemplate.description}
                        </p>
                      )}
                      
                      {workoutTemplate.exercises && workoutTemplate.exercises.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Exercises:</h4>
                          <div className="space-y-2">
                            {workoutTemplate.exercises.map((exercise, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{exercise.name}</p>
                                  {exercise.notes && (
                                    <p className="text-xs text-muted-foreground">{exercise.notes}</p>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {exercise.sets && exercise.reps && (
                                    <span>{exercise.sets} x {exercise.reps}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No exercises defined for this workout.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No workout template linked to this class</p>
                    <p className="text-sm mt-2">Use the Edit tab to link a workout template</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="edit">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={editForm.capacity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Workout Template
                  </Label>
                  <Select
                    value={editForm.workout_template_id}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, workout_template_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workout template" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="">No workout linked</SelectItem>
                      {workoutTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.difficulty && ` (${template.difficulty})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link a workout template for members to follow during this class
                  </p>
                </div>

                <Button onClick={handleSaveEdit} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="add">
              <ScrollArea className="h-[300px]">
                {availableMembersForBooking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    All members are already booked
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableMembersForBooking.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{member.full_name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddBooking(member.id)}
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          {confirmedBookings.length >= classEvent.capacity ? 'Add to Waitlist' : 'Book'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {classEvent.status !== 'cancelled' && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="destructive" onClick={handleCancelClass}>
                Cancel Class
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
