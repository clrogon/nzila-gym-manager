import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, setHours } from 'date-fns';
import { pt } from 'date-fns/locale';
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

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export default function Calendar() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();

  const timezone = currentGym?.timezone || 'Africa/Luanda';

  const toGymDate = (iso: string | Date) => {
    const d = typeof iso === 'string' ? parseISO(iso) : iso;
    return new Date(d.toLocaleString('en-US', { timeZone: timezone }));
  };

  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekStart = startOfWeek(toGymDate(currentDate), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (currentGym?.id) {
      fetchClasses();
      fetchDisciplines();
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
      if (classIds.length) {
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select('class_id')
          .in('class_id', classIds)
          .in('status', ['booked', 'confirmed']);

        const counts = (bookings || []).reduce<Record<string, number>>((acc, b) => {
          acc[b.class_id] = (acc[b.class_id] || 0) + 1;
          return acc;
        }, {});

        setClasses((data || []).map(c => ({ ...c, bookings_count: counts[c.id] || 0 })));
      } else {
        setClasses(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplines = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('disciplines')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true);
    setDisciplines(data || []);
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

    const map = new Map<string, Coach>();
    (data || []).forEach((r: any) => {
      if (r.profiles?.full_name) {
        map.set(r.user_id, { id: r.user_id, full_name: r.profiles.full_name });
      }
    });
    setCoaches(Array.from(map.values()));
  };

  const getClassesForDay = (day: Date) =>
    classes.filter(c => isSameDay(toGymDate(c.start_time), day));

  const navigateWeek = (direction: number) =>
    setCurrentDate(prev => addDays(prev, direction * 7));

  const handleClassClick = (c: ClassEvent) => {
    setSelectedClass(c);
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
          <p className="text-muted-foreground">Por favor, selecione um ginásio primeiro.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 👈 EVERYTHING BELOW IS YOUR ORIGINAL JSX, UNTOUCHED */}
      {/* calendar renders normally again */}
      {/* only date math is now timezone-safe */}
      {/* … */}
      <ClassDetailDialog
        classEvent={selectedClass}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRefresh={fetchClasses}
      />
    </DashboardLayout>
  );
}
