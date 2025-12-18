import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

interface Props {
  gymId: string
  disciplines: Discipline[]
  locations: Location[]
  coaches: Coach[]
  onSuccess: () => void
  onClose: () => void
}

export function RecurringClassForm({
  gymId,
  disciplines,
  locations,
  coaches,
  onSuccess,
  onClose,
}: Props) {
  const [title, setTitle] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)

    if (
      !title ||
      !disciplineId ||
      !locationId ||
      !date ||
      !startTime ||
      !endTime
    ) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)

    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)

    const { error } = await supabase.from('classes').insert({
      gym_id: gymId,
      title,
      class_type_id: disciplineId,
      location_id: locationId,
      coach_id: coachId || null,
      start_time: start.toISOString(), // UTC
      end_time: end.toISOString(),     // UTC
      capacity,
      status: 'scheduled',
    })

    setLoading(false)

    if (error) {
      console.error(error)
      setError('Erro ao criar a aula.')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div>
        <Label>Título</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Cross Training"
        />
      </div>

      <div>
        <Label>Disciplina</Label>
        <Select value={disciplineId} onValueChange={setDisciplineId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar disciplina" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map(d => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Local</Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar local" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(l => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Coach (opcional)</Label>
        <Select value={coachId} onValueChange={setCoachId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar coach" />
          </SelectTrigger>
          <SelectContent>
            {coaches.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Data</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Capacidade</Label>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Início</Label>
          <Input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <Label>Fim</Label>
          <Input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          Criar Aula
        </Button>
      </div>
    </div>
  )
}
