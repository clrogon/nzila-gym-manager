import { supabase } from '@/integrations/supabase/client';
import { addDays, addMonths, parseISO, format } from 'date-fns';
import { checkLocationAvailability, checkCoachAvailability } from '@/utils/scheduleValidation';

export interface RecurringClassPattern {
  title: string;
  description?: string;
  gymId: string;
  classTypeId: string;
  locationId: string;
  coachId?: string;
  capacity: number;
  
  // Recurrence
  recurrenceType: 'daily' | 'weekly' | 'monthly';
  recurrenceDays?: number[]; // [1,3,5] = Mon, Wed, Fri (ISO: 1=Monday, 7=Sunday)
  startDate: string;
  endDate?: string;
  
  // Time (same for all occurrences)
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  
  // Options
  maxOccurrences?: number;
}

export interface SeriesCreationResult {
  seriesId: string;
  classesCreated: number;
  conflicts: Array<{ date: string; reason: string }>;
}

interface ClassOccurrence {
  gym_id: string;
  title: string;
  description: string | null;
  class_type_id: string;
  location_id: string;
  coach_id: string | null;
  capacity: number;
  start_time: string;
  end_time: string;
  status: string;
  is_recurring: boolean;
}

/**
 * Create a recurring class series with individual class instances
 */
export async function createRecurringSeries(
  pattern: RecurringClassPattern
): Promise<SeriesCreationResult> {
  const conflicts: Array<{ date: string; reason: string }> = [];
  
  try {
    // 1. Create series record
    const { data: series, error: seriesError } = await supabase
      .from('class_series')
      .insert({
        gym_id: pattern.gymId,
        title: pattern.title,
        description: pattern.description || null,
        class_type_id: pattern.classTypeId,
        location_id: pattern.locationId,
        coach_id: pattern.coachId || null,
        capacity: pattern.capacity,
        recurrence_type: pattern.recurrenceType,
        recurrence_days: pattern.recurrenceDays || [],
        start_date: pattern.startDate,
        end_date: pattern.endDate || null,
        start_time: pattern.startTime,
        end_time: pattern.endTime
      })
      .select()
      .single();

    if (seriesError) throw seriesError;

    // 2. Generate occurrences
    const occurrences = generateOccurrences(pattern);
    
    // 3. Check each occurrence for conflicts
    const validOccurrences: (ClassOccurrence & { series_id: string })[] = [];
    
    for (const occurrence of occurrences) {
      // Check location availability
      const locationCheck = await checkLocationAvailability(
        pattern.locationId,
        occurrence.start_time,
        occurrence.end_time
      );

      if (!locationCheck.isAvailable) {
        conflicts.push({
          date: occurrence.start_time,
          reason: `Local ocupado: ${locationCheck.conflicts.map(c => c.title).join(', ')}`
        });
        continue;
      }

      // Check coach availability
      if (pattern.coachId) {
        const coachCheck = await checkCoachAvailability(
          pattern.coachId,
          occurrence.start_time,
          occurrence.end_time
        );

        if (!coachCheck.isAvailable) {
          conflicts.push({
            date: occurrence.start_time,
            reason: `Coach ocupado: ${coachCheck.conflicts.map(c => c.title).join(', ')}`
          });
          continue;
        }
      }

      validOccurrences.push({
        ...occurrence,
        series_id: series.id
      });
    }

    // 4. Bulk insert valid occurrences
    if (validOccurrences.length > 0) {
      const { error: insertError } = await supabase
        .from('classes')
        .insert(validOccurrences);

      if (insertError) throw insertError;
    }

    return {
      seriesId: series.id,
      classesCreated: validOccurrences.length,
      conflicts
    };

  } catch (error) {
    console.error('Failed to create recurring series:', error);
    throw error;
  }
}

/**
 * Create a single class (non-recurring)
 */
export async function createSingleClass(params: {
  gymId: string;
  title: string;
  description?: string;
  classTypeId: string;
  locationId: string;
  coachId?: string;
  capacity: number;
  startTime: string;
  endTime: string;
}): Promise<{ success: boolean; classId?: string; error?: string }> {
  try {
    // Check location availability
    const locationCheck = await checkLocationAvailability(
      params.locationId,
      params.startTime,
      params.endTime
    );

    if (!locationCheck.isAvailable) {
      return {
        success: false,
        error: `Local ocupado: ${locationCheck.conflicts.map(c => c.title).join(', ')}`
      };
    }

    // Check coach availability
    if (params.coachId) {
      const coachCheck = await checkCoachAvailability(
        params.coachId,
        params.startTime,
        params.endTime
      );

      if (!coachCheck.isAvailable) {
        return {
          success: false,
          error: `Coach ocupado: ${coachCheck.conflicts.map(c => c.title).join(', ')}`
        };
      }
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        gym_id: params.gymId,
        title: params.title,
        description: params.description || null,
        class_type_id: params.classTypeId,
        location_id: params.locationId,
        coach_id: params.coachId || null,
        capacity: params.capacity,
        start_time: params.startTime,
        end_time: params.endTime,
        status: 'scheduled',
        is_recurring: false
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, classId: data.id };
  } catch (error: any) {
    console.error('Failed to create single class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate individual class occurrences from a pattern
 */
function generateOccurrences(pattern: RecurringClassPattern): ClassOccurrence[] {
  const occurrences: ClassOccurrence[] = [];
  const startDate = parseISO(pattern.startDate);
  const endDate = pattern.endDate ? parseISO(pattern.endDate) : addMonths(startDate, 3);
  const maxCount = pattern.maxOccurrences || 100;

  let currentDate = startDate;
  let count = 0;

  while (currentDate <= endDate && count < maxCount) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday...
    const dayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO (1-7, Mon-Sun)

    // Check if this day should have a class
    const shouldCreateClass = 
      pattern.recurrenceType === 'daily' ||
      (pattern.recurrenceType === 'weekly' && pattern.recurrenceDays?.includes(dayOfWeekISO)) ||
      (pattern.recurrenceType === 'monthly' && currentDate.getDate() === startDate.getDate());

    if (shouldCreateClass) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const startDateTime = `${dateStr}T${pattern.startTime}:00`;
      const endDateTime = `${dateStr}T${pattern.endTime}:00`;

      occurrences.push({
        gym_id: pattern.gymId,
        title: pattern.title,
        description: pattern.description || null,
        class_type_id: pattern.classTypeId,
        location_id: pattern.locationId,
        coach_id: pattern.coachId || null,
        capacity: pattern.capacity,
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'scheduled',
        is_recurring: true
      });

      count++;
    }

    // Always increment by 1 day to check each day
    currentDate = addDays(currentDate, 1);
  }

  return occurrences;
}

/**
 * Delete a recurring series
 */
export async function deleteRecurringSeries(
  seriesId: string,
  deleteOption: 'future' | 'all'
): Promise<void> {
  try {
    if (deleteOption === 'all') {
      // Delete all classes in series
      await supabase
        .from('classes')
        .delete()
        .eq('series_id', seriesId);

      // Delete series record
      await supabase
        .from('class_series')
        .delete()
        .eq('id', seriesId);
    } else {
      // Delete only future classes
      await supabase
        .from('classes')
        .delete()
        .eq('series_id', seriesId)
        .gte('start_time', new Date().toISOString());
    }
  } catch (error) {
    console.error('Failed to delete series:', error);
    throw error;
  }
}

/**
 * Update a single class instance (optionally breaking from series)
 */
export async function updateClassInstance(
  classId: string,
  updates: {
    title?: string;
    description?: string;
    locationId?: string;
    coachId?: string;
    capacity?: number;
    startTime?: string;
    endTime?: string;
  },
  breakFromSeries: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // If changing time or location, check for conflicts
    if (updates.startTime && updates.endTime && updates.locationId) {
      const locationCheck = await checkLocationAvailability(
        updates.locationId,
        updates.startTime,
        updates.endTime,
        classId
      );

      if (!locationCheck.isAvailable) {
        return {
          success: false,
          error: `Local ocupado: ${locationCheck.conflicts.map(c => c.title).join(', ')}`
        };
      }
    }

    const updateData: Record<string, any> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.locationId !== undefined) updateData.location_id = updates.locationId;
    if (updates.coachId !== undefined) updateData.coach_id = updates.coachId;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;

    if (breakFromSeries) {
      updateData.series_id = null;
      updateData.is_recurring = false;
    }

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update class:', error);
    return { success: false, error: error.message };
  }
}
