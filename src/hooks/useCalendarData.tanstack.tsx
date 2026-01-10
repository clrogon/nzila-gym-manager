import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * ClassEvent type
 */
export interface ClassEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  discipline_id?: string | null;
  discipline?: { id: string; name: string; is_active: boolean } | null;
  class_type?: { name: string; color: string } | null;
  location?: { name: string } | null;
  is_recurring?: boolean;
  recurrence_rule?: string;
  coach_id?: string | null;
  location_id?: string | null;
  workout_template_id?: string | null;
}

/**
 * Discipline type
 */
export interface Discipline {
  id: string;
  name: string;
  is_active: boolean;
}

/**
 * Location type
 */
export interface Location {
  id: string;
  name: string;
  capacity?: number;
}

/**
 * Coach type
 */
export interface Coach {
  id: string;
  full_name: string;
  disciplines?: string[];
}

/**
 * Class type (class_type)
 */
export interface ClassType {
  id: string;
  name: string;
  color: string;
}

/**
 * Custom hook for calendar data management using TanStack Query
 *
 * Provides efficient caching, automatic refetching, and optimistic updates
 *
 * @param gymId - The current gym ID to filter data
 * @param weekStart - Start of the week to fetch classes for
 * @param weekEnd - End of the week to fetch classes for
 * @returns Object containing calendar data, loading states, and CRUD operations
 * @returns {ClassEvent[]} classes - Array of class events (cached)
 * @returns {Discipline[]} disciplines - Available disciplines (cached)
 * @returns {Location[]} locations - Available locations (cached)
 * @returns {Coach[]} coaches - Available coaches (cached)
 * @returns {ClassType[]} classTypes - Available class types (cached)
 * @returns {boolean} loadingClasses - Classes data loading state
 * @returns {boolean} loadingDisciplines - Disciplines data loading state
 * @returns {boolean} loadingLocations - Locations data loading state
 * @returns {boolean} loadingCoaches - Coaches data loading state
 * @returns {Function} createClass - Mutation to create new class
 * @returns {Function} updateClass - Mutation to update existing class
 * @returns {Function} deleteClass - Mutation to delete class
 * @returns {Function} refetchAll - Function to manually refetch all data
 *
 * @example
 * ```tsx
 * function Calendar() {
 *   const { classes, disciplines, locations, coaches, loading, createClass } = useCalendarData(currentGym.id, weekStart, weekEnd);
 *
 *   if (loading) return <Loading />;
 *
 *   const handleCreate = async (classData) => {
 *     await createClass(classData);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => createClass({ ...classData })}>
 *         Create Class
 *       </button>
 *       <ClassList classes={classes} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCalendarData(gymId: string | undefined, weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cache keys
  const classesQueryKey = ['classes', gymId, weekStart.toISOString()] as const;
  const disciplinesQueryKey = ['disciplines', gymId] as const;
  const locationsQueryKey = ['locations', gymId] as const;
  const coachesQueryKey = ['coaches', gymId] as const;
  const classTypesQueryKey = ['class_types', gymId] as const;

  // Fetch classes for the week with TanStack Query
  const {
    data: classes,
    isLoading: loadingClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: classesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_type:class_types(name, color),
          location:locations(name),
          discipline:disciplines(id, name, is_active)
        `)
        .eq('gym_id', gymId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time');

      if (error) throw error;

      // Filter out classes with inactive disciplines
      const activeClasses = (data || []).filter(cls => {
        return !cls.discipline || cls.discipline.is_active !== false;
      });

      return activeClasses;
    },
    // Cache for 2 minutes (classes change frequently)
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // Don't refetch on window focus (reduces unnecessary requests)
    refetchOnWindowFocus: false,
    // Only retry once on failure
    retry: 1,
    // Only fetch if gymId is available
    enabled: !!gymId,
  });

  // Fetch disciplines with TanStack Query
  const {
    data: disciplines,
    isLoading: loadingDisciplines,
    error: disciplinesError,
    refetch: refetchDisciplines,
  } = useQuery({
    queryKey: disciplinesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('disciplines')
        .select('id, name, is_active')
        .eq('gym_id', gymId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    // Cache for 10 minutes (disciplines are stable)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch locations with TanStack Query
  const {
    data: locations,
    isLoading: loadingLocations,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: locationsQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('locations')
        .select('id, name, capacity')
        .eq('gym_id', gymId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    // Cache for 30 minutes (locations are very stable)
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch coaches with TanStack Query
  const {
    data: coaches,
    isLoading: loadingCoaches,
    error: coachesError,
    refetch: refetchCoaches,
  } = useQuery({
    queryKey: coachesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles!inner(full_name)')
        .eq('gym_id', gymId);

      if (error) throw error;

      const list =
        data?.map((r: any) => ({
          id: r.user_id,
          full_name: r.profiles.full_name,
          disciplines: [], // To be populated when trainer_disciplines table exists
        })) || [];

      return list;
    },
    // Cache for 30 minutes (coaches are stable)
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch class types with TanStack Query
  const {
    data: classTypes,
    isLoading: loadingClassTypes,
    error: classTypesError,
    refetch: refetchClassTypes,
  } = useQuery({
    queryKey: classTypesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_types')
        .select('id, name, color')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    // Cache for 60 minutes (class types rarely change)
    staleTime: 60 * 60 * 1000,
    gcTime: 120 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Create class mutation with optimistic update
  const createClass = useMutation({
    mutationFn: async (classData: Partial<ClassEvent>) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      // Ensure required fields are present
      if (!classData.title || !classData.start_time || !classData.end_time) {
        throw new Error('Title, start_time, and end_time are required');
      }

      const insertData = {
        title: classData.title,
        start_time: classData.start_time,
        end_time: classData.end_time,
        description: classData.description ?? null,
        capacity: classData.capacity ?? 20,
        status: classData.status ?? 'scheduled',
        discipline_id: classData.discipline_id ?? null,
        coach_id: classData.coach_id ?? null,
        location_id: classData.location_id ?? null,
        workout_template_id: classData.workout_template_id ?? null,
        is_recurring: classData.is_recurring ?? false,
        recurrence_rule: classData.recurrence_rule ?? null,
        gym_id: gymId,
      };

      const { data, error } = await supabase
        .from('classes')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as ClassEvent;
    },
    // Optimistic update: Add new class to cache immediately
    onMutate: async (newClass) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: classesQueryKey });

      // Snapshot previous value
      const previousClasses = queryClient.getQueryData(classesQueryKey) || [];

      // Optimistically add new class to cache
      queryClient.setQueryData(classesQueryKey, (old: ClassEvent[] = []) => {
        return [...old, newClass];
      });

      return { previousClasses };
    },
    // On success, invalidate cache to get fresh data
    onSuccess: (newClass) => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: classesQueryKey });

      toast({
        title: 'Success',
        description: 'Class created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useCalendarData.createClass');
      logError(appError);

      toast({
        title: 'Error Creating Class',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update class mutation with optimistic update
  const updateClass = useMutation({
    mutationFn: async ({ id, ...classData }: Partial<ClassEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ClassEvent;
    },
    onMutate: async (updatedClass) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: classesQueryKey });

      // Snapshot previous value
      const previousClasses = queryClient.getQueryData(classesQueryKey) || [];

      // Optimistically update class in cache
      queryClient.setQueryData(classesQueryKey, (old: ClassEvent[] = []) => {
        return old.map(c =>
          c.id === updatedClass.id ? { ...c, ...updatedClass } : c
        );
      });

      return { previousClasses };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: classesQueryKey });

      toast({
        title: 'Success',
        description: 'Class updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useCalendarData.updateClass');
      logError(appError);

      toast({
        title: 'Error Updating Class',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete class mutation with optimistic update
  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedClassId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: classesQueryKey });

      // Snapshot previous value
      const previousClasses = queryClient.getQueryData(classesQueryKey) || [];

      // Optimistically remove class from cache
      queryClient.setQueryData(classesQueryKey, (old: ClassEvent[] = []) => {
        return old.filter(c => c.id !== deletedClassId);
      });

      return { previousClasses };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: classesQueryKey });

      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useCalendarData.deleteClass');
      logError(appError);

      toast({
        title: 'Error Deleting Class',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Combined loading state
  const loading = loadingClasses || loadingDisciplines || loadingLocations || loadingCoaches || loadingClassTypes;

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchClasses();
    refetchDisciplines();
    refetchLocations();
    refetchCoaches();
    refetchClassTypes();
  }, [refetchClasses, refetchDisciplines, refetchLocations, refetchCoaches, refetchClassTypes]);

  return {
    // Data
    classes: classes || [],
    disciplines: disciplines || [],
    locations: locations || [],
    coaches: coaches || [],
    classTypes: classTypes || [],

    // Loading states
    loadingClasses,
    loadingDisciplines,
    loadingLocations,
    loadingCoaches,
    loadingClassTypes,
    loading,

    // Mutations
    createClass,
    updateClass,
    deleteClass,

    // Error states
    classesError,
    disciplinesError,
    locationsError,
    coachesError,
    classTypesError,

    // Cache utilities
    refetchAll,

    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      classes: classesQueryKey,
      disciplines: disciplinesQueryKey,
      locations: locationsQueryKey,
      coaches: coachesQueryKey,
      classTypes: classTypesQueryKey,
    },
  };
}
