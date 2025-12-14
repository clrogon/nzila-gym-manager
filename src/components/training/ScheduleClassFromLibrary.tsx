import { useState, useEffect } from 'react';
import { format, setHours, setMinutes, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CalendarIcon, Repeat } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface GymClass {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  default_duration: number | null;
  default_capacity: number | null;
  category: string | null;
}

interface Location {
  id: string;
  name: string;
}

interface Props {
  gymClass: GymClass;
  trigger?: React.ReactNode;
}

export function ScheduleClassFromLibrary({ gymClass, trigger }: Props) {
  const { currentGym } = useGym();
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    start_date: new Date(),
    start_time: '09:00',
    location_id: '',
    capacity: gymClass.default_capacity || 20,
    is_recurring: false,
    selected_days: [] as number[],
    duration_weeks: 4,
  });

  useEffect(() => {
    if (open && currentGym?.id) {
      fetchLocations();
    }
  }, [open, currentGym?.id]);

  const fetchLocations = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('locations')
      .select('id, name')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true);
    setLocations(data || []);
  };

  const generateInstances = () => {
    const durationMinutes = gymClass.default_duration || 60;
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    const instances: { start_time: Date; end_time: Date }[] = [];

    if (!formData.is_recurring) {
      const startTime = setMinutes(setHours(formData.start_date, hours), minutes);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      instances.push({ start_time: startTime, end_time: endTime });
    } else {
      const totalDays = formData.duration_weeks * 7;
      for (let day = 0; day < totalDays; day++) {
        const currentDate = addDays(formData.start_date, day);
        const dayOfWeek = (currentDate.getDay() + 6) % 7;
        if (formData.selected_days.includes(dayOfWeek)) {
          const startTime = setMinutes(setHours(currentDate, hours), minutes);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + durationMinutes);
          instances.push({ start_time: startTime, end_time: endTime });
        }
      }
    }
    return instances;
  };

  const checkConflicts = async (instances: { start_time: Date; end_time: Date }[]) => {
    if (!currentGym?.id || !formData.location_id) return [];
    
    const conflicts: { date: string; existingClass: string }[] = [];
    
    for (const inst of instances) {
      const { data: existing } = await supabase
        .from('classes')
        .select('title, start_time')
        .eq('gym_id', currentGym.id)
        .eq('location_id', formData.location_id)
        .neq('status', 'cancelled')
        .lte('start_time', inst.end_time.toISOString())
        .gte('end_time', inst.start_time.toISOString());
      
      if (existing && existing.length > 0) {
        conflicts.push({
          date: format(inst.start_time, 'EEE, MMM d @ h:mm a'),
          existingClass: existing[0].title,
        });
      }
    }
    
    return conflicts;
  };

  const handleSchedule = async () => {
    if (!currentGym?.id) return;
    
    const instances = generateInstances();
    if (instances.length === 0) {
      toast.error('Select days for recurring schedule');
      return;
    }

    if (!formData.location_id) {
      toast.error('Please select a location');
      return;
    }

    setLoading(true);
    
    // Check for conflicts BEFORE inserting
    const conflicts = await checkConflicts(instances);
    if (conflicts.length > 0) {
      const conflictMessages = conflicts.slice(0, 3).map(c => `${c.date}: "${c.existingClass}"`);
      const moreText = conflicts.length > 3 ? ` and ${conflicts.length - 3} more conflicts` : '';
      toast.error(`Scheduling conflicts at ${formData.location_id ? 'this location' : ''}:\n${conflictMessages.join('\n')}${moreText}`);
      setLoading(false);
      return;
    }
    
    try {
      // First ensure class_type exists
      let classTypeId: string;
      const { data: existingType } = await supabase
        .from('class_types')
        .select('id')
        .eq('gym_id', currentGym.id)
        .eq('name', gymClass.name)
        .maybeSingle();

      if (existingType) {
        classTypeId = existingType.id;
      } else {
        const { data: newType, error: typeError } = await supabase
          .from('class_types')
          .insert({
            gym_id: currentGym.id,
            name: gymClass.name,
            color: gymClass.color || '#3B82F6',
            duration_minutes: gymClass.default_duration || 60,
            capacity: gymClass.default_capacity || 20,
            description: gymClass.description,
          })
          .select('id')
          .single();
        
        if (typeError) throw typeError;
        classTypeId = newType.id;
      }

      const classesToInsert = instances.map((inst, idx) => ({
        gym_id: currentGym.id,
        title: gymClass.name,
        description: gymClass.description,
        class_type_id: classTypeId,
        location_id: formData.location_id || null,
        start_time: inst.start_time.toISOString(),
        end_time: inst.end_time.toISOString(),
        capacity: formData.capacity,
        is_recurring: formData.is_recurring,
        recurrence_rule: formData.is_recurring && idx === 0
          ? JSON.stringify({ days: formData.selected_days, weeks: formData.duration_weeks })
          : null,
      }));

      const { error } = await supabase.from('classes').insert(classesToInsert);
      if (error) throw error;

      toast.success(`Scheduled ${instances.length} class${instances.length > 1 ? 'es' : ''}`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule class');
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
  };

  const instanceCount = generateInstances().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm" variant="outline">Schedule</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule: {gymClass.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={formData.location_id} onValueChange={(v) => setFormData(prev => ({ ...prev, location_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
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

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="recurring-lib">Recurring</Label>
            </div>
            <Switch
              id="recurring-lib"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
            />
          </div>

          {formData.is_recurring && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Repeat On</Label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.selected_days.includes(idx) ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => toggleDay(idx)}
                    >
                      {day[0]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>For</Label>
                <Select
                  value={String(formData.duration_weeks)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 4, 6, 8, 12].map(w => (
                      <SelectItem key={w} value={String(w)}>{w} week{w > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Creates <strong>{instanceCount}</strong> classes
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
