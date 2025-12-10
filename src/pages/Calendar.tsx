import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addHours, setHours, setMinutes } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  User,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ClassEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  class_type?: { name: string; color: string } | null;
  location?: { name: string } | null;
  bookings_count?: number;
}

interface ClassType {
  id: string;
  name: string;
  color: string;
  duration_minutes: number;
  capacity: number;
}

interface Location {
  id: string;
  name: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

export default function Calendar() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [filterType, setFilterType] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_type_id: '',
    location_id: '',
    start_date: new Date(),
    start_time: '09:00',
    capacity: 20,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (currentGym?.id) {
      fetchClasses();
      fetchClassTypes();
      fetchLocations();
    }
  }, [currentGym?.id, currentDate, filterType]);

  const fetchClasses = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          class_type:class_types(name, color),
          location:locations(name)
        `)
        .eq('gym_id', currentGym.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', addDays(weekStart, 7).toISOString())
        .order('start_time');

      if (filterType !== 'all') {
        query = query.eq('class_type_id', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTypes = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('class_types')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true);
    setClassTypes(data || []);
  };

  const fetchLocations = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true);
    setLocations(data || []);
  };

  const handleCreateClass = async () => {
    if (!currentGym?.id) return;
    
    const selectedType = classTypes.find(t => t.id === formData.class_type_id);
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    const startTime = setMinutes(setHours(formData.start_date, hours), minutes);
    const endTime = addHours(startTime, (selectedType?.duration_minutes || 60) / 60);

    try {
      const { error } = await supabase.from('classes').insert({
        gym_id: currentGym.id,
        title: formData.title || selectedType?.name || 'Class',
        description: formData.description || null,
        class_type_id: formData.class_type_id || null,
        location_id: formData.location_id || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        capacity: formData.capacity,
      });

      if (error) throw error;
      toast.success('Class created successfully');
      setIsCreateOpen(false);
      fetchClasses();
      setFormData({
        title: '',
        description: '',
        class_type_id: '',
        location_id: '',
        start_date: new Date(),
        start_time: '09:00',
        capacity: 20,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    }
  };

  const getClassesForDay = (day: Date) => {
    return classes.filter(c => isSameDay(parseISO(c.start_time), day));
  };

  const getClassStyle = (classEvent: ClassEvent) => {
    const color = classEvent.class_type?.color || '#3B82F6';
    return {
      backgroundColor: `${color}20`,
      borderLeft: `3px solid ${color}`,
    };
  };

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction * 7));
  };

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select a gym first.</p>
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
            <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground">Schedule and manage classes</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasPermission('classes:create') && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Schedule New Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Class Type</Label>
                      <Select
                        value={formData.class_type_id}
                        onValueChange={(v) => {
                          const type = classTypes.find(t => t.id === v);
                          setFormData(prev => ({
                            ...prev,
                            class_type_id: v,
                            title: type?.name || prev.title,
                            capacity: type?.capacity || prev.capacity,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {classTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                                {type.name} ({type.duration_minutes} min)
                              </div>
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
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(formData.start_date, 'PPP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarWidget
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
                        <Select
                          value={formData.location_id}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, location_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
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

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Class description"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateClass}>
                        Create Class
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
                </h2>
                <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {viewMode === 'week' ? (
              <div className="overflow-x-auto">
                {/* Week Header */}
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2 text-xs text-muted-foreground">Time</div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'p-2 text-center border-l',
                        isSameDay(day, new Date()) && 'bg-primary/5'
                      )}
                    >
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={cn(
                        'text-lg font-semibold',
                        isSameDay(day, new Date()) && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
                      <div className="p-2 text-xs text-muted-foreground">
                        {format(setHours(new Date(), hour), 'h a')}
                      </div>
                      {weekDays.map((day) => {
                        const dayClasses = getClassesForDay(day).filter(c => {
                          const classHour = parseISO(c.start_time).getHours();
                          return classHour === hour;
                        });

                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={cn(
                              'border-l p-1 relative',
                              isSameDay(day, new Date()) && 'bg-primary/5'
                            )}
                          >
                            {dayClasses.map((classEvent) => (
                              <div
                                key={classEvent.id}
                                className="p-2 rounded text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                                style={getClassStyle(classEvent)}
                              >
                                <div className="font-medium truncate">{classEvent.title}</div>
                                <div className="text-muted-foreground">
                                  {format(parseISO(classEvent.start_time), 'h:mm a')}
                                </div>
                                {classEvent.location && (
                                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {classEvent.location.name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {weekDays.map((day) => {
                  const dayClasses = getClassesForDay(day);
                  if (dayClasses.length === 0) return null;

                  return (
                    <div key={day.toISOString()}>
                      <h3 className={cn(
                        'font-semibold mb-2',
                        isSameDay(day, new Date()) && 'text-primary'
                      )}>
                        {format(day, 'EEEE, MMMM d')}
                        {isSameDay(day, new Date()) && (
                          <Badge variant="secondary" className="ml-2">Today</Badge>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {dayClasses.map((classEvent) => (
                          <div
                            key={classEvent.id}
                            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                            style={{ borderLeftColor: classEvent.class_type?.color || '#3B82F6', borderLeftWidth: 4 }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{classEvent.title}</div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {format(parseISO(classEvent.start_time), 'h:mm a')} - {format(parseISO(classEvent.end_time), 'h:mm a')}
                                </span>
                                {classEvent.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {classEvent.location.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {classEvent.bookings_count || 0}/{classEvent.capacity}
                                </span>
                              </div>
                            </div>
                            <Badge variant={classEvent.status === 'cancelled' ? 'destructive' : 'secondary'}>
                              {classEvent.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {classes.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No classes scheduled this week
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Types Legend */}
        {classTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Class Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {classTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm">{type.name}</span>
                    <span className="text-xs text-muted-foreground">({type.duration_minutes} min)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
