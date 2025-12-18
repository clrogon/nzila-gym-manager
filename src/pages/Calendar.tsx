import { useState, useEffect } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  parseISO,
  setHours,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { pt } from 'date-fns/locale'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useGym } from '@/contexts/GymContext'
import { useRBAC } from '@/hooks/useRBAC'
import { supabase } from '@/integrations/supabase/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { cn } from '@/lib/utils'

import { RecurringClassForm } from '@/components/calendar/RecurringClassForm'
import { ClassDetailDialog } from '@/components/calendar/ClassDetailDialog'

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
} from 'lucide-react'

/* =========================
   Types
========================= */

interface ClassEvent {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  capacity: number
  status: string
  is_recurring?: boolean
  recurrence_rule?: string
  class_type?: { name: string; color: string } | null
  location?: { name: string } | null
  bookings_count?: number
}

interface Discipline {
  id: string
  name: string
  category: string | null
  is_active: boolean
}

interface Location {
  id: string
  name: string
  capacity?: number
}

interface Coach {
  id: string
  full_name: string
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

/* =========================
   Component
========================= */

export default function Calendar() {
  const { currentGym } = useGym()
  const { hasPermission } = useRBAC()

  const gymTimezone = currentGym?.timezone || 'Africa/Luanda'

  const [viewMode, setViewMode] = useState<'week' | 'list'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i),
  )

  /* =========================
     Time helpers (CRITICAL)
  ========================= */

  const getGymDayKey = (date: Date | string) =>
    formatInTimeZone(new Date(date), gymTimezone, 'yyyy-MM-dd')

  const getGymHour = (date: Date | string) =>
    Number(formatInTimeZone(new Date(date), gymTimezone, 'H'))

  const formatGymTime = (date: Date | string, fmt = 'HH:mm') =>
    formatInTimeZone(new Date(date), gymTimezone, fmt)

  /* =========================
     Data fetching
  ========================= */

  useEffect(() => {
    if (currentGym?.id) {
      fetchClasses()
      fetchDisciplines()
      fetchLocations()
      fetchCoaches()
    }
  }, [currentGym?.id, currentDate, filterType])

  const fetchClasses = async () => {
    if (!currentGym?.id) return
    setLoading(true)

    try {
      let query = supabase
        .from('classes')
        .select(
          `
          *,
          class_type:class_types(name, color),
          location:locations(name)
        `,
        )
        .eq('gym_id', currentGym.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', addDays(weekStart, 7).toISOString())
        .order('start_time')

      if (filterType !== 'all') {
        query = query.eq('class_type_id', filterType)
      }

      const { data, error } = await query
      if (error) throw error

      const classIds = (data || []).map(c => c.id)

      if (classIds.length > 0) {
        const { data: bookings } = await supabase
          .from('class_bookings')
          .select('class_id')
          .in('class_id', classIds)
          .in('status', ['booked', 'confirmed'])

        const bookingCounts = (bookings || []).reduce(
          (acc, b) => {
            acc[b.class_id] = (acc[b.class_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        setClasses(
          (data || []).map(c => ({
            ...c,
            bookings_count: bookingCounts[c.id] || 0,
          })),
        )
      } else {
        setClasses(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar aulas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDisciplines = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('disciplines')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)

    setDisciplines(data || [])
  }

  const fetchLocations = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)

    setLocations(data || [])
  }

  const fetchCoaches = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, profiles!inner(id, full_name)')
      .eq('gym_id', currentGym.id)
      .in('role', ['staff', 'admin', 'gym_owner'])

    const coachList =
      (data || [])
        .filter((r: any) => r.profiles?.full_name)
        .map((r: any) => ({
          id: r.user_id,
          full_name: r.profiles.full_name,
        })) || []

    const uniqueCoaches = coachList.filter(
      (coach, index, self) =>
        index === self.findIndex(c => c.id === coach.id),
    )

    setCoaches(uniqueCoaches)
  }

  /* =========================
     Calendar logic (FIXED)
  ========================= */

  const getClassesForDay = (day: Date) => {
    const dayKey = getGymDayKey(day)
    return classes.filter(
      c => getGymDayKey(c.start_time) === dayKey,
    )
  }

  const getClassStyle = (classEvent: ClassEvent) => {
    const color = classEvent.class_type?.color || '#3B82F6'
    return {
      backgroundColor: `${color}20`,
      borderLeft: `3px solid ${color}`,
    }
  }

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction * 7))
  }

  const handleClassClick = (classEvent: ClassEvent) => {
    setSelectedClass(classEvent)
    setDetailOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    fetchClasses()
  }

  /* =========================
     Guards
  ========================= */

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Por favor, selecione um ginásio primeiro.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  /* =========================
     Render
  ========================= */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        {/* … (intencionalmente igual ao teu original) */}

        {/* CALENDAR */}
        {/* HEADER */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
    <h1 className="text-2xl font-display font-bold text-foreground">
      Calendário
    </h1>
    <p className="text-muted-foreground">
      Agendar e gerir aulas com opções recorrentes
    </p>
  </div>

  <div className="flex items-center gap-2">
    <Select value={filterType} onValueChange={setFilterType}>
      <SelectTrigger className="w-[200px]">
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Filtrar por disciplina" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as Aulas</SelectItem>
        {disciplines.map(d => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
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
            <DialogTitle>Agendar Aula</DialogTitle>
          </DialogHeader>
          <RecurringClassForm
            disciplines={disciplines}
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

        <Card>
          <CardContent>
            {viewMode === 'week' ? (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2 text-xs text-muted-foreground">
                    Hora
                  </div>
                  {weekDays.map(day => (
                    <div
                      key={day.toISOString()}
                      className="p-2 text-center border-l"
                    >
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'EEE', { locale: pt })}
                      </div>
                      <div className="text-lg font-semibold">
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="grid grid-cols-8 border-b min-h-[60px]"
                  >
                    <div className="p-2 text-xs text-muted-foreground">
                      {format(setHours(new Date(), hour), 'HH:mm')}
                    </div>

                    {weekDays.map(day => {
                      const dayClasses =
                        getClassesForDay(day).filter(
                          c => getGymHour(c.start_time) === hour,
                        )

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="border-l p-1"
                        >
                          {dayClasses.map(classEvent => (
                            <div
                              key={classEvent.id}
                              className="p-2 rounded text-xs mb-1 cursor-pointer"
                              style={getClassStyle(classEvent)}
                              onClick={() =>
                                handleClassClick(classEvent)
                              }
                            >
                              <div className="font-medium truncate">
                                {classEvent.title}
                              </div>
                              <div className="text-muted-foreground">
                                {formatGymTime(
                                  classEvent.start_time,
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}
          </CardContent>
        </Card>

        <ClassDetailDialog
          classEvent={selectedClass}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onRefresh={fetchClasses}
        />
      </div>
    </DashboardLayout>
  )
}
