import { supabase } from '@/integrations/supabase/client';

export interface ConflictingClass {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export interface OverlapCheckResult {
  isAvailable: boolean;
  conflicts: ConflictingClass[];
}

/**
 * Check if a location is available for a given time slot
 */
export async function checkLocationAvailability(
  locationId: string,
  startTime: string,
  endTime: string,
  excludeClassId?: string
): Promise<OverlapCheckResult> {
  try {
    const { data, error } = await supabase.rpc('check_location_overlap', {
      p_location_id: locationId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_class_id: excludeClassId || null
    });

    if (error) throw error;

    const result = data?.[0];
    const rawConflicts = result?.conflicting_classes;
    const conflicts: ConflictingClass[] = Array.isArray(rawConflicts) 
      ? (rawConflicts as unknown as ConflictingClass[])
      : [];
    return {
      isAvailable: result?.is_available ?? true,
      conflicts
    };
  } catch (error) {
    console.error('Location overlap check failed:', error);
    // Default to available if check fails (let DB constraint catch it)
    return { isAvailable: true, conflicts: [] };
  }
}

/**
 * Check if a coach is available for a given time slot
 */
export async function checkCoachAvailability(
  coachId: string | null,
  startTime: string,
  endTime: string,
  excludeClassId?: string
): Promise<OverlapCheckResult> {
  if (!coachId) {
    return { isAvailable: true, conflicts: [] };
  }

  try {
    const { data, error } = await supabase.rpc('check_coach_overlap', {
      p_coach_id: coachId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_class_id: excludeClassId || null
    });

    if (error) throw error;

    const result = data?.[0];
    const rawConflicts = result?.conflicting_classes;
    const conflicts: ConflictingClass[] = Array.isArray(rawConflicts) 
      ? (rawConflicts as unknown as ConflictingClass[])
      : [];
    return {
      isAvailable: result?.is_available ?? true,
      conflicts
    };
  } catch (error) {
    console.error('Coach overlap check failed:', error);
    return { isAvailable: true, conflicts: [] };
  }
}

/**
 * Validate class time constraints
 */
export function validateClassTime(startTime: Date, endTime: Date): string | null {
  const now = new Date();
  
  // Must be in the future (with 5 min buffer for form submission)
  if (startTime < new Date(now.getTime() - 5 * 60 * 1000)) {
    return 'A aula não pode ser no passado';
  }

  // End must be after start
  if (endTime <= startTime) {
    return 'Hora de fim deve ser após hora de início';
  }

  // Reasonable duration (15 min - 4 hours)
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  
  if (durationMinutes < 15) {
    return 'Aula deve durar pelo menos 15 minutos';
  }
  
  if (durationMinutes > 240) {
    return 'Aula não pode durar mais de 4 horas';
  }

  return null;
}

/**
 * Validate class capacity
 */
export function validateClassCapacity(
  capacity: number, 
  locationCapacity?: number
): string | null {
  if (capacity < 1) {
    return 'Capacidade deve ser pelo menos 1';
  }

  if (capacity > 200) {
    return 'Capacidade não pode exceder 200';
  }

  if (locationCapacity && capacity > locationCapacity) {
    return `Capacidade excede limite do local (${locationCapacity})`;
  }

  return null;
}

/**
 * Validate entire class form
 */
export type ClassFormValidation = {
  [key: string]: string | undefined;
  title?: string;
  classTypeId?: string;
  locationId?: string;
  capacity?: string;
  time?: string;
  recurrence?: string;
  startDate?: string;
}

export function validateClassForm(params: {
  title: string;
  classTypeId: string;
  locationId: string;
  capacity: number;
  startDate: string;
  startTime: string;
  endTime: string;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  selectedDays?: number[];
  locationCapacity?: number;
}): ClassFormValidation {
  const errors: ClassFormValidation = {};

  if (!params.title.trim()) {
    errors.title = 'Título é obrigatório';
  }

  if (!params.classTypeId) {
    errors.classTypeId = 'Disciplina é obrigatória';
  }

  if (!params.locationId) {
    errors.locationId = 'Local é obrigatório';
  }

  if (!params.startDate) {
    errors.startDate = 'Data de início é obrigatória';
  }

  // Validate capacity
  const capacityError = validateClassCapacity(
    params.capacity,
    params.locationCapacity
  );
  if (capacityError) {
    errors.capacity = capacityError;
  }

  // Validate time
  if (params.startDate && params.startTime && params.endTime) {
    const start = new Date(`${params.startDate}T${params.startTime}`);
    const end = new Date(`${params.startDate}T${params.endTime}`);
    const timeError = validateClassTime(start, end);
    if (timeError) {
      errors.time = timeError;
    }
  }

  // Validate recurrence
  if (params.recurrenceType === 'weekly' && (!params.selectedDays || params.selectedDays.length === 0)) {
    errors.recurrence = 'Selecione pelo menos um dia da semana';
  }

  return errors;
}
