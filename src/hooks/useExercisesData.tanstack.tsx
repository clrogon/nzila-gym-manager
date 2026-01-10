import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * GymExercise type
 */
export interface GymExercise {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  equipment: string | null;
  instructions: string | null;
  muscle_groups: string[] | null;
  video_url: string | null;
  is_active: boolean;
  discipline_id?: string | null;
  discipline?: {
    id: string;
    name: string;
    is_active: boolean;
  } | null;
}

/**
 * Exercise form data type
 */
export interface ExerciseFormData {
  name: string;
  description: string;
  category: string;
  equipment: string;
  instructions: string;
  muscle_groups: string[];
  video_url: string;
  is_active: boolean;
  discipline_id: string | null;
}

/**
 * Custom hook for exercise data management using TanStack Query
 *
 * Provides efficient caching, automatic refetching, and optimistic updates
 *
 * @param gymId - The current gym ID to filter exercises
 * @returns Object containing exercise data, loading states, and CRUD operations
 * @returns {GymExercise[]} exercises - Array of exercise objects (cached)
 * @returns {boolean} loadingExercises - Exercises data loading state
 * @returns {Function} createExercise - Mutation to create new exercise
 * @returns {Function} updateExercise - Mutation to update existing exercise
 * @returns {Function} deleteExercise - Mutation to delete exercise
 * @returns {Function} refetchAll - Function to manually refetch all data
 *
 * @example
 * ```tsx
 * function ExerciseLibrary() {
 *   const { exercises, loading, createExercise, updateExercise, deleteExercise } = useExercisesData(currentGym.id);
 *
 *   if (loading) return <Loading />;
 *
 *   const handleCreate = async (exerciseData: ExerciseFormData) => {
 *     await createExercise(exerciseData);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => createExercise({ ...exerciseData })}>
 *         Create Exercise
 *       </button>
 *       <ExerciseList exercises={exercises} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useExercisesData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cache key
  const exercisesQueryKey = ['exercises', gymId] as const;

  // Fetch exercises with TanStack Query
  const {
    data: exercises,
    isLoading: loadingExercises,
    error: exercisesError,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: exercisesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('gym_exercises')
        .select('*')
        .eq('gym_id', gymId)
        .order('name');

      if (error) throw error;

      // Filter out exercises with inactive disciplines
      // This will work after migration is run and discipline_id column exists
      const filtered = (data || []).filter((ex: any) => {
        return !ex.discipline || (ex.discipline && ex.discipline.is_active !== false);
      });

      return filtered;
    },
    // Cache for 15 minutes (exercises are stable but can change)
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Don't refetch on window focus (reduces unnecessary requests)
    refetchOnWindowFocus: false,
    // Only retry once on failure
    retry: 1,
    // Only fetch if gymId is available
    enabled: !!gymId,
  });

  // Memoize exercises by category for efficient lookups
  const exercisesByCategory = useMemo(() => {
    if (!exercises) return {};
    const map: Record<string, GymExercise[]> = {};
    exercises.forEach((exercise) => {
      const category = exercise.category || 'uncategorized';
      if (!map[category]) {
        map[category] = [];
      }
      map[category].push(exercise);
    });
    return map;
  }, [exercises]);

  // Create exercise mutation with optimistic update
  const createExercise = useMutation({
    mutationFn: async (exerciseData: ExerciseFormData) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      const insertData: any = {
        name: exerciseData.name,
        description: exerciseData.description,
        category: exerciseData.category,
        equipment: exerciseData.equipment,
        instructions: exerciseData.instructions,
        muscle_groups: exerciseData.muscle_groups,
        video_url: exerciseData.video_url,
        is_active: exerciseData.is_active,
        gym_id: gymId,
      };

      // Only include discipline_id if provided (for after migration)
      if (exerciseData.discipline_id) {
        insertData.discipline_id = exerciseData.discipline_id;
      }

      const { data, error } = await supabase
        .from('gym_exercises')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as GymExercise;
    },
    // Optimistic update: Add new exercise to cache immediately
    onMutate: async (newExercise) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: exercisesQueryKey });

      // Snapshot previous value
      const previousExercises = queryClient.getQueryData(exercisesQueryKey) || [];

      // Optimistically add new exercise to cache
      queryClient.setQueryData(exercisesQueryKey, (old: GymExercise[] = []) => {
        return [...old, newExercise];
      });

      return { previousExercises };
    },
    // On success, invalidate cache to get fresh data
    onSuccess: (newExercise) => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: exercisesQueryKey });

      toast({
        title: 'Success',
        description: 'Exercise created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useExercisesData.createExercise');
      logError(appError);

      toast({
        title: 'Error Creating Exercise',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update exercise mutation with optimistic update
  const updateExercise = useMutation({
    mutationFn: async ({ id, ...exerciseData }: Partial<ExerciseFormData> & { id: string }) => {
      const updateData: any = { ...exerciseData };

      // Only include discipline_id in update if explicitly provided (for after migration)
      if (exerciseData.discipline_id !== undefined) {
        updateData.discipline_id = exerciseData.discipline_id;
      } else {
        delete (updateData as any).discipline_id;
      }

      const { data, error } = await supabase
        .from('gym_exercises')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GymExercise;
    },
    onMutate: async (updatedExercise) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: exercisesQueryKey });

      // Snapshot previous value
      const previousExercises = queryClient.getQueryData(exercisesQueryKey) || [];

      // Optimistically update exercise in cache
      queryClient.setQueryData(exercisesQueryKey, (old: GymExercise[] = []) => {
        return old.map(e =>
          e.id === updatedExercise.id ? { ...e, ...updatedExercise } : e
        );
      });

      return { previousExercises };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: exercisesQueryKey });

      toast({
        title: 'Success',
        description: 'Exercise updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useExercisesData.updateExercise');
      logError(appError);

      toast({
        title: 'Error Updating Exercise',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete exercise mutation with optimistic update
  const deleteExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gym_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedExerciseId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: exercisesQueryKey });

      // Snapshot previous value
      const previousExercises = queryClient.getQueryData(exercisesQueryKey) || [];

      // Optimistically remove exercise from cache
      queryClient.setQueryData(exercisesQueryKey, (old: GymExercise[] = []) => {
        return old.filter(e => e.id !== deletedExerciseId);
      });

      return { previousExercises };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: exercisesQueryKey });

      toast({
        title: 'Success',
        description: 'Exercise deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useExercisesData.deleteExercise');
      logError(appError);

      toast({
        title: 'Error Deleting Exercise',
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
  const loading = loadingExercises;

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchExercises();
  }, [refetchExercises]);

  return {
    // Data
    exercises: exercises || [],
    exercisesByCategory,

    // Loading state
    loadingExercises,
    loading,

    // Mutations
    createExercise,
    updateExercise,
    deleteExercise,

    // Error states
    exercisesError,

    // Cache utilities
    refetchAll,

    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      exercises: exercisesQueryKey,
    },
  };
}
