import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  createRecurringSeries, 
  createSingleClass 
} from '@/services/recurringClassService';
import { validateClassForm } from '@/utils/scheduleValidation';
import { Loader2, AlertCircle, Calendar as CalendarIcon, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  capacity?: number;
}

interface RecurringClassFormProps {
  gymId: string;
  disciplines: Array<{ id: string; name: string }>;
  locations: Location[];
  coaches: Array<{ id: string; full_name: string }>;
  onSuccess: () => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' }
];

export function RecurringClassForm({
  gymId,
  disciplines,
  locations,
  coaches,
  onSuccess,
  onClose
}: RecurringClassFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<Array<{ date: string; reason: string }>>([]);
  const [mode, setMode] = useState<'single' | 'recurring'>('single');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classTypeId, setClassTypeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [capacity, setCapacity] = useState('20');
  
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const selectedLocation = locations.find(l => l.id === locationId);

  const validateForm = (): boolean => {
    const formErrors = validateClassForm({
      title,
      classTypeId,
      locationId,
      capacity: parseInt(capacity) || 0,
      startDate,
      startTime,
      endTime,
      recurrenceType: mode === 'recurring' ? recurrenceType : undefined,
      selectedDays: mode === 'recurring' ? selectedDays : undefined,
      locationCapacity: selectedLocation?.capacity
    });

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija os erros antes de continuar');
      return;
    }

    setLoading(true);
    setConflicts([]);

    try {
      if (mode === 'single') {
        // Create single class
        const startDateTime = `${startDate}T${startTime}:00`;
        const endDateTime = `${startDate}T${endTime}:00`;

        const result = await createSingleClass({
          gymId,
          title: title.trim(),
          description: description.trim() || undefined,
          classTypeId,
          locationId,
          coachId: coachId || undefined,
          capacity: parseInt(capacity),
          startTime: startDateTime,
          endTime: endDateTime
        });

        if (result.success) {
          toast.success('Aula criada com sucesso');
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || 'Erro ao criar aula');
        }
      } else {
        // Create recurring series
        const result = await createRecurringSeries({
          title: title.trim(),
          description: description.trim() || undefined,
          gymId,
          classTypeId,
          locationId,
          coachId: coachId || undefined,
          capacity: parseInt(capacity),
          recurrenceType,
          recurrenceDays: recurrenceType === 'weekly' ? selectedDays : undefined,
          startDate,
          endDate: endDate || undefined,
          startTime,
          endTime
        });

        if (result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          toast.warning(
            `${result.classesCreated} aulas criadas, ${result.conflicts.length} conflitos ignorados`
          );
        } else {
          toast.success(`${result.classesCreated} aulas criadas com sucesso`);
        }

        if (result.classesCreated > 0) {
          onSuccess();
        }
      }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Failed to create class(es):', error);
      toast.error('Erro ao criar aula(s)');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'recurring')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" />
            Aula Única
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Série Recorrente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4 space-y-4">
          {/* Single class fields */}
          <CommonFields
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            classTypeId={classTypeId}
            setClassTypeId={setClassTypeId}
            locationId={locationId}
            setLocationId={setLocationId}
            coachId={coachId}
            setCoachId={setCoachId}
            capacity={capacity}
            setCapacity={setCapacity}
            disciplines={disciplines}
            locations={locations}
            coaches={coaches}
            errors={errors}
            loading={loading}
          />

          {/* Date & Time for single */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>Início *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
        </TabsContent>

        <TabsContent value="recurring" className="mt-4 space-y-4">
          {/* Recurring class fields */}
          <CommonFields
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            classTypeId={classTypeId}
            setClassTypeId={setClassTypeId}
            locationId={locationId}
            setLocationId={setLocationId}
            coachId={coachId}
            setCoachId={setCoachId}
            capacity={capacity}
            setCapacity={setCapacity}
            disciplines={disciplines}
            locations={locations}
            coaches={coaches}
            errors={errors}
            loading={loading}
          />

          {/* Recurrence Type */}
          <div className="space-y-2">
            <Label>Padrão de Repetição</Label>
            <Select 
              value={recurrenceType} 
              onValueChange={(v) => setRecurrenceType(v as typeof recurrenceType)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days of Week (for weekly) */}
          {recurrenceType === 'weekly' && (
            <div className="space-y-2">
              <Label>Dias da Semana *</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center space-x-1">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                      disabled={loading}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.recurrence && <p className="text-xs text-destructive">{errors.recurrence}</p>}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, cria 3 meses
              </p>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora de Início *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora de Fim *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
        </TabsContent>
      </Tabs>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Conflitos detetados (ignorados):</p>
            <ul className="list-disc list-inside text-sm space-y-1 max-h-24 overflow-y-auto">
              {conflicts.slice(0, 5).map((conflict, i) => (
                <li key={i}>
                  {new Date(conflict.date).toLocaleDateString('pt-PT')} - {conflict.reason}
                </li>
              ))}
              {conflicts.length > 5 && (
                <li>... e mais {conflicts.length - 5} conflitos</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              A criar...
            </>
          ) : mode === 'single' ? (
            'Criar Aula'
          ) : (
            'Criar Série'
          )}
        </Button>
      </div>
    </form>
  );
}

// Common fields component to avoid duplication
function CommonFields({
  title, setTitle,
  description, setDescription,
  classTypeId, setClassTypeId,
  locationId, setLocationId,
  coachId, setCoachId,
  capacity, setCapacity,
  disciplines,
  locations,
  coaches,
  errors,
  loading
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  classTypeId: string;
  setClassTypeId: (v: string) => void;
  locationId: string;
  setLocationId: (v: string) => void;
  coachId: string;
  setCoachId: (v: string) => void;
  capacity: string;
  setCapacity: (v: string) => void;
  disciplines: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string; capacity?: number }>;
  coaches: Array<{ id: string; full_name: string }>;
  errors: Record<string, string>;
  loading: boolean;
}) {
  return (
    <>
      {/* Title */}
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Yoga Matinal"
          disabled={loading}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Descrição opcional..."
          disabled={loading}
        />
      </div>

      {/* Discipline & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Disciplina *</Label>
          <Select value={classTypeId} onValueChange={setClassTypeId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.classTypeId && <p className="text-xs text-destructive">{errors.classTypeId}</p>}
        </div>

        <div className="space-y-2">
          <Label>Local *</Label>
          <Select value={locationId} onValueChange={setLocationId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(l => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} {l.capacity && `(${l.capacity})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.locationId && <p className="text-xs text-destructive">{errors.locationId}</p>}
        </div>
      </div>

      {/* Coach & Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Instrutor</Label>
          <Select value={coachId} onValueChange={setCoachId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {coaches.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Capacidade *</Label>
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
            max="200"
            disabled={loading}
          />
          {errors.capacity && <p className="text-xs text-destructive">{errors.capacity}</p>}
        </div>
      </div>
    </>
  );
}
