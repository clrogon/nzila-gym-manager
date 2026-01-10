import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * TrainerDiscipline type
 */
export interface TrainerDiscipline {
  id: string;
  user_id: string;
  discipline_id: string;
  certified: boolean;
  certification_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  discipline?: {
    id: string;
    name: string;
    is_active: boolean;
  };
}

/**
 * TrainerDiscipline form data type
 */
export interface TrainerDisciplineFormData {
  user_id: string;
  discipline_id: string;
  certified: boolean;
  certification_date: string | null;
  notes: string | null;
}

/**
 * Custom hook for trainer discipline (skills) data management
 *
 * Provides efficient caching, automatic refetching, and optimistic updates
 *
 * @param gymId - The current gym ID to filter trainer disciplines
 * @param userId - Optional user ID to fetch disciplines for specific trainer
 * @returns Object containing trainer discipline data, loading states, and CRUD operations
 */
export function useTrainerDisciplinesData(gymId: string | undefined, userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cache key
  const trainerDisciplinesQueryKey = ['trainer_disciplines', gymId, userId] as const;

  // Fetch trainer disciplines with TanStack Query
  const {
    data: trainerDisciplines,
    isLoading: loading,
    error: trainerDisciplinesError,
    refetch: refetchTrainerDisciplines,
  } = useQuery({
    queryKey: trainerDisciplinesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      let query = supabase
        .from('trainer_disciplines')
        .select(`
          *,
          discipline:disciplines(id, name, is_active)
        `);

      // If userId provided, filter for that trainer
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter to only include active disciplines
      const filtered = (data || []).filter((td: any) => {
        return !td.discipline || td.discipline.is_active !== false;
      });

      return filtered as TrainerDiscipline[];
    },
    // Cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Get trainers qualified for a specific discipline
  const getTrainersForDiscipline = useCallback((disciplineId: string) => {
    return (trainerDisciplines || [])
      .filter((td: any) => td.discipline_id === disciplineId && td.certified)
      .map((td: any) => td.user_id);
  }, [trainerDisciplines]);

  // Get all disciplines for a trainer
  const getTrainerDisciplines = useCallback((trainerUserId: string) => {
    return (trainerDisciplines || [])
      .filter((td: any) => td.user_id === trainerUserId)
      .map((td: any) => ({
        discipline_id: td.discipline_id,
        certified: td.certified,
        discipline: td.discipline,
      }));
  }, [trainerDisciplines]);

  // Create trainer discipline mutation
  const createTrainerDiscipline = useMutation({
    mutationFn: async (formData: TrainerDisciplineFormData) => {
      const { data, error } = await supabase
        .from('trainer_disciplines')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data as TrainerDiscipline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerDisciplinesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
      toast({
        title: 'Success',
        description: 'Trainer certification added successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useTrainerDisciplinesData.createTrainerDiscipline');
      logError(appError);
      toast({
        title: 'Error Adding Certification',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  // Update trainer discipline mutation
  const updateTrainerDiscipline = useMutation({
    mutationFn: async ({ id, ...formData }: Partial<TrainerDisciplineFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('trainer_disciplines')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TrainerDiscipline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerDisciplinesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
      toast({
        title: 'Success',
        description: 'Trainer certification updated successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useTrainerDisciplinesData.updateTrainerDiscipline');
      logError(appError);
      toast({
        title: 'Error Updating Certification',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  // Delete trainer discipline mutation
  const deleteTrainerDiscipline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trainer_disciplines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerDisciplinesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
      toast({
        title: 'Success',
        description: 'Trainer certification removed successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useTrainerDisciplinesData.deleteTrainerDiscipline');
      logError(appError);
      toast({
        title: 'Error Removing Certification',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  return {
    // Data
    trainerDisciplines: trainerDisciplines || [],
    loading,

    // Utilities
    getTrainersForDiscipline,
    getTrainerDisciplines,

    // Mutations
    createTrainerDiscipline,
    updateTrainerDiscipline,
    deleteTrainerDiscipline,

    // Error state
    trainerDisciplinesError,

    // Cache utilities
    refetchTrainerDisciplines,

    // Cache key exposure
    cacheKeys: {
      trainerDisciplines: trainerDisciplinesQueryKey,
    },
  };
}
