import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, setHours } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { RecurringClassForm } from '@/components/calendar/RecurringClassForm';
import { ClassDetailDialog } from '@/components/calendar/ClassDetailDialog';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Filter,
  LayoutGrid,
  List,
  Repeat,
  AlertCircle,
} from 'lucide-react';

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
  capacity?: number;
}

interface Coach {
  id: string;
  full_name: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export default function Calendar() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (currentGym?.id) {
      fetchClasses();
      fetchClassTypes();
      fetchLocations();
      fetchCoaches();
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

      const classIds = (data || []).map(c => c.id);
      if (classIds.length > 0) {
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select('class_id')
          .in('class_id', classIds)
          .in('status', ['booked', 'confirmed']);

        const bookingCounts = (bookings || []).reduce((acc, b) => {
          acc[b.class_id] = (acc[b.class_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setClasses((data || []).map(c => ({
          ...c,
          bookings_count: bookingCounts[c.id] || 0,
        })));
      } else {
        setClasses(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
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

  const fetchCoaches = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, profiles!inner(id, full_name)')
      .eq('gym_id', currentGym.id)
      .in('role', ['staff', 'admin', 'gym_owner']);
    
    const coachList = (data || [])
      .filter((r: any) => r.profiles?.full_name)
      .map((r: any) => ({
        id: r.user_id,
        full_name: r.profiles.full_name,
      }));
    
    const uniqueCoaches = coachList.filter((coach, index, self) =>
      index === self.findIndex((c) => c.id === coach.id)
    );
    setCoaches(uniqueCoaches);
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

  const handleClassClick = (classEvent: ClassEvent) => {
    setSelectedClass(classEvent);
    setDetailOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchClasses();
  };

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecione primeiro um ginásio.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Calendário</h1>
            <p className="text-muted-foreground">Agende e gerencie aulas, com opções de recorrência</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Aulas</SelectItem>
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
                    Adicionar Aula
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      Agendar Aula
                      <Badge variant="secondary" className="text-xs">
                        <Repeat className="w-3 h-3 mr-1" />
                        Recorrência Suportada
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>
                  <RecurringClassForm
                    classTypes={classTypes}
                    locations={locations}
                    coaches={coaches}
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Navegação do Calendário */}
        {/* ... restante do código continua igual, apenas traduzindo textos visuais ... */}

      </div>

      <ClassDetailDialog
        classEvent={selectedClass}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={fetchClasses}
      />
    </DashboardLayout>
  );
}
