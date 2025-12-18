import { useState, useEffect } from 'react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CalendarIcon, AlertTriangle, Repeat, Dumbbell } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Discipline {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
}

interface Location {
  id: string;
  name: string;
  capacity?: number;
}

interface Coach {
  id: string;
  full_name: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  category: string | null;
  difficulty: string | null;
}

interface Props {
  disciplines: Discipline[];
  locations: Location[];
  coaches: Coach[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface ConflictInfo {
  date: string;
  existingClass: string;
  location: string;
  type: 'location' | 'coach';
  coachName?: string;
}

export function RecurringClassForm({ disciplines, locations, coaches, onSuccess, onCancel }: Props) {
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discipline_id: '',
    location_id: '',
    coach_id: '',
    workout_template_id: '',
    start_date: new Date(),
    start_time: '09:00',
    capacity: 20,
    is_recurring: false,
    recurrence_type: 'weekly',
    selected_days: [] as number[],
    duration_weeks: 4,
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchWorkoutTemplates();
    }
  }, [currentGym?.id]);

  const fetchWorkoutTemplates = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('workout_templates')
      .select('id, name, category, difficulty')
      .eq('gym_id', currentGym.id)
      .order('name');
    setWorkoutTemplates(data || []);
  };

  const checkConflicts = async (classesToCreate: { start_time: Date; end_time: Date; location_id: string }[]) => {
    if (!currentGym?.id) return [];
    
    const foundConflicts: ConflictInfo[] = [];
    
    for (const cls of classesToCreate) {
      if (formData.location_id) {
        const { data: locationConflicts } = await supabase
          .from('classes')
          .select('title, start_time, end_time, location:locations(name)')
          .eq('gym_id', currentGym.id)
          .eq('location_id', formData.location_id)
          .neq('status', 'cancelled')
          .lte('start_time', cls.end_time.toISOString())
          .gte('end_time', cls.start_time.toISOString());
        
        if (locationConflicts && locationConflicts.length > 0) {
          foundConflicts.push({
            date: format(cls.start_time, 'EEE, MMM d @ h:mm a'),
            existingClass: locationConflicts[0].title,
            location: (locationConflicts[0].location as any)?.name || 'Unknown',
            type: 'location',
          });
        }
      }
      
      if (formData.coach_id) {
        const { data: coachConflicts } = await supabase
          .from('classes')
          .select('title, start_time, end_time')
          .eq('gym_id', currentGym.id)
          .eq('coach_id', formData.coach_id)
          .neq('status', 'cancelled')
          .lte('start_time', cls.end_time.toISOString())
          .gte('end_time', cls.start_time.toISOString());
        
        if (coachConflicts && coachConflicts.length > 0) {
          const coach = coaches.find(c => c.id === formData.coach_id);
          foundConflicts.push({
            date: format(cls.start_time, 'EEE, MMM d @ h:mm a'),
            existingClass: coachConflicts[0].title,
            location: '',
            type: 'coach',
            coachName: coach?.full_name || 'Coach',
          });
        }
      }
    }
    
    return foundConflicts;
  };

  const generateClassInstances = () => {
    const selectedDiscipline = disciplines.find(d => d.id === formData.discipline_id);
    const durationMinutes = 60;
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    
    const instances: { start_time: Date; end_time: Date; location_id: string }[] = [];
    
    if (!formData.is_recurring) {
      const startTime = setMinutes(setHours(formData.start_date, hours), minutes);
      const endTime = addDays(startTime, 0);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      instances.push({ start_time: startTime, end_time: endTime, location_id: formData.location_id });
    } else {
      const totalDays = formData.duration_weeks * 7;
      
      for (let day = 0; day < totalDays; day++) {
        const currentDate = addDays(formData.start_date, day);
        const dayOfWeek = (currentDate.getDay() + 6) % 7;
        
        if (formData.recurrence_type === 'daily' || formData.selected_days.includes(dayOfWeek)) {
          const startTime = setMinutes(setHours(currentDate, hours), minutes);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + durationMinutes);
          instances.push({ start_time: startTime, end_time: endTime, location_id: formData.location_id });
        }
      }
    }
    
    return instances;
  };

  const handleSubmit = async () => {
    if (!currentGym?.id) return;
    
    const selectedDiscipline = disciplines.find(d => d.id === formData.discipline_id);
    const instances = generateClassInstances();
    
    if (instances.length === 0) {
      toast.error('No classes to create. Select days for recurring.');
      return;
    }
    
    setLoading(true);
    
    const foundConflicts = await checkConflicts(instances);
    if (foundConflicts.length > 0) {
      setConflicts(foundConflicts);
      setLoading(false);
      return;
    }
    
    try {
      const recurrenceRule = formData.is_recurring
        ? JSON.stringify({
            type: formData.recurrence_type,
            days: formData.selected_days,
            weeks: formData.duration_weeks,
          })
        : null;
      
      const classesToInsert = instances.map((inst, idx) => ({
        gym_id: currentGym.id,
        title: formData.title || selectedDiscipline?.name || 'Class',
        description: formData.description || null,
        discipline_id: formData.discipline_id || null,
        location_id: formData.location_id || null,
        coach_id: formData.coach_id || null,
        workout_template_id: formData.workout_template_id || null,
        start_time: inst.start_time.toISOString(),
        end_time: inst.end_time.toISOString(),
        capacity: formData.capacity,
        is_recurring: formData.is_recurring,
        recurrence_rule: idx === 0 ? recurrenceRule : null,
      }));
      
      const { error } = await supabase.from('classes').insert(classesToInsert);
      if (error) throw error;
      
      toast.success(`Created ${instances.length} class${instances.length > 1 ? 'es' : ''}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create classes');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day].sort(),
    }));
    setConflicts([]);
  };

  const instanceCount = generateClassInstances().length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Disciplina</Label>
        <Select
          value={formData.discipline_id}
          onValueChange={(v) => {
            const discipline = disciplines.find(d => d.id === v);
            setFormData(prev => ({
              ...prev,
              discipline_id: v,
              title: discipline?.name || prev.title,
            }));
            setConflicts([]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar disciplina" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            {disciplines.map(discipline => (
              <SelectItem key={discipline.id} value={discipline.id}>
                {discipline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title (optional)</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Class title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.start_date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border z-50" align="start">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, start_date: date }));
                    setConflicts([]);
                  }
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, start_time: e.target.value }));
              setConflicts([]);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={formData.location_id}
            onValueChange={(v) => {
              setFormData(prev => ({ ...prev, location_id: v }));
              setConflicts([]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Capacity</Label>
          <Input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Coach (optional)</Label>
        <Select
          value={formData.coach_id}
          onValueChange={(v) => {
            setFormData(prev => ({ ...prev, coach_id: v }));
            setConflicts([]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select coach" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="">No coach assigned</SelectItem>
            {coaches.map(coach => (
              <SelectItem key={coach.id} value={coach.id}>{coach.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Workout Template Dropdown */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" />
          Workout Template (optional)
        </Label>
        <Select
          value={formData.workout_template_id}
          onValueChange={(v) => setFormData(prev => ({ ...prev, workout_template_id: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Link a workout template" />
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
          Link a workout template to this class for members to follow
        </p>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="recurring">Recurring Class</Label>
        </div>
        <Switch
          id="recurring"
          checked={formData.is_recurring}
          onCheckedChange={(checked) => {
            setFormData(prev => ({ ...prev, is_recurring: checked }));
            setConflicts([]);
          }}
        />
      </div>

      {formData.is_recurring && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>Repeat On</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.selected_days.includes(idx) ? 'default' : 'outline'}
                  size="sm"
                  className="w-10"
                  onClick={() => toggleDay(idx)}
                >
                  {day[0]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration (weeks)</Label>
            <Select
              value={String(formData.duration_weeks)}
              onValueChange={(v) => {
                setFormData(prev => ({ ...prev, duration_weeks: parseInt(v) }));
                setConflicts([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {[1, 2, 4, 6, 8, 12].map(w => (
                  <SelectItem key={w} value={String(w)}>{w} week{w > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Will create <strong>{instanceCount}</strong> class{instanceCount > 1 ? 'es' : ''}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Class description"
          rows={2}
        />
      </div>

      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Scheduling conflicts detected:</p>
            <ul className="text-sm space-y-1">
              {conflicts.slice(0, 5).map((c, i) => (
                <li key={i}>
                  {c.type === 'coach' 
                    ? `${c.date} - Coach "${c.coachName}" is already scheduled for "${c.existingClass}"`
                    : `${c.date} - "${c.existingClass}" at ${c.location}`
                  }
                </li>
              ))}
              {conflicts.length > 5 && (
                <li>...and {conflicts.length - 5} more conflicts</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !formData.discipline_id}>
          {loading ? 'A criar...' : `Criar ${instanceCount > 1 ? `${instanceCount} Aulas` : 'Aula'}`}
        </Button>
      </div>
    </div>
  );
}
