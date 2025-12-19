import { useState, useEffect } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  setHours,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { pt } from 'date-fns/locale'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useGym } from '@/contexts/GymContext'
import { useRBAC } from '@/hooks/useRBAC'
import { supabase } from '@/integrations/supabase/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

import { RecurringClassForm } from '@/components/calendar/RecurringClassForm'
import { ClassDetailDialog } from '@/components/calendar/ClassDetailDialog'

import {
  Plus,
  Filter,
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
  class_type?: { name: string; color: string } | null
  location?: { name: string } | null
  bookings_count?: number
}

interface Discipline {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
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

  const [currentDate, setCurrentDate] = useState(new Date())
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  const [filterType, setFilterType] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i),
  )

  /* =========================
     Time helpers (CORRETOS)
  ========================= */

  const getGymDayKey = (date: Date | string) =>
    formatInTimeZone(new Date(date), gymTimezone, 'yyyy-MM-dd')

  const getGymHour = (date: Date | string) =>
    Number(formatInTimeZone(new Date(date), gymTimezone, 'H'))

  const formatGymTime = (date: Date | string) =>
    formatInTimeZone(new Date(date), gymTimezone, 'HH:mm')

  /* =========================
     Data fetching
  ========================= */

  useEffect(() => {
    if (!currentGym?.id) return
    fetchAll()
  }, [currentGym?.id, currentDate, filterType])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchClasses(),
      fetchDisciplines(),
      fetchLocations(),
      fetchCoaches(),
    ])
    setLoading(false)
  }

  const fetchClasses = async () => {
    if (!currentGym?.id) return

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
      .order('start_time')

    if (filterType !== 'all') {
      query = query.eq('class_type_id', filterType)
    }

    const { data, error } = await query
    if (error) {
      console.error(error)
      return
    }

    setClasses(data || [])
  }

  const fetchDisciplines = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('disciplines')
      .select('id, name')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)

    setDisciplines(data || [])
  }

  const fetchLocations = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('locations')
      .select('id, name')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)

    setLocations(data || [])
  }

  const fetchCoaches = async () => {
    if (!currentGym?.id) return
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, profiles!inner(full_name)')
      .eq('gym_id', currentGym.id)

    const list =
      data?.map((r: any) => ({
        id: r.user_id,
        full_name: r.profiles.full_name,
      })) || []

    setCoaches(list)
  }

  /* =========================
     Calendar logic
  ========================= */

  const getClassesForDay = (day: Date) =>
    classes.filter(
      c => getGymDayKey(c.start_time) === getGymDayKey(day),
    )

  const getClassStyle = (c: ClassEvent) => {
    const color = c.class_type?.color || '#3B82F6'
    return {
      backgroundColor: `${color}20`,
      borderLeft: `3px solid ${color}`,
    }
  }

  /* =========================
     Guards
  ========================= */

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">
          Selecione um ginásio primeiro.
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">
          A carregar calendário…
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Calendário</h1>
            <p className="text-muted-foreground">
              Gestão semanal de aulas
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
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
                    gymId={currentGym.id}
                    disciplines={disciplines}
                    locations={locations}
                    coaches={coaches}
                    onSuccess={() => {
                      setIsCreateOpen(false)
                      fetchClasses()
                    }}
                    onClose={() => setIsCreateOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* WEEK GRID */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-8 border-b">
              <div />
              {weekDays.map(d => (
                <div key={d.toISOString()} className="p-2 text-center">
                  <div className="text-xs text-muted-foreground">
                    {format(d, 'EEE', { locale: pt })}
                  </div>
                  <div className="font-semibold">
                    {format(d, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
                <div className="p-2 text-xs text-muted-foreground">
                  {format(setHours(new Date(), hour), 'HH:mm')}
                </div>

                {weekDays.map(day => {
                  const items = getClassesForDay(day).filter(
                    c => getGymHour(c.start_time) === hour,
                  )

                  return (
                    <div key={`${day}-${hour}`} className="p-1 border-l">
                      {items.map(c => (
                        <div
                          key={c.id}
                          className="p-2 mb-1 rounded text-xs cursor-pointer"
                          style={getClassStyle(c)}
                          onClick={() => {
                            setSelectedClass(c)
                            setDetailOpen(true)
                          }}
                        >
                          <div className="font-medium truncate">
                            {c.title}
                          </div>
                          <div className="text-muted-foreground">
                            {formatGymTime(c.start_time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
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
