import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Discipline {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  gym_id: string;
  is_active: boolean | null;
  created_at: string;
}

export interface DisciplineRank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string | null;
  requirements: string | null;
  criteria: Json | null;
  created_at: string;
}

export interface DisciplineFormData {
  name: string;
  description: string;
  category: string;
  equipment: string;
  instructor_profile: string;
}

export interface RankFormData {
  discipline_id: string;
  name: string;
  level: number;
  color: string;
  requirements: string;
}

export function useDisciplinesData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  const canCreate = hasPermission('disciplines:create');
  const canUpdate = hasPermission('disciplines:update');
  const canDelete = hasPermission('disciplines:delete');

  const disciplinesQueryKey = ['disciplines', gymId] as const;
  const disciplineRanksQueryKey = ['discipline_ranks', gymId] as const;

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
        .select('*')
        .eq('gym_id', gymId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Discipline[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  const {
    data: disciplineRanks,
    isLoading: loadingRanks,
    error: ranksError,
    refetch: refetchRanks,
  } = useQuery({
    queryKey: disciplineRanksQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('discipline_ranks')
        .select('*')
        .order('discipline_id')
        .order('level');

      if (error) throw error;
      return (data || []) as DisciplineRank[];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  const ranksByDiscipline = useMemo(() => {
    const map: Record<string, DisciplineRank[]> = {};
    (disciplineRanks || []).forEach((rank) => {
      if (!map[rank.discipline_id]) {
        map[rank.discipline_id] = [];
      }
      map[rank.discipline_id].push(rank);
    });
    return map;
  }, [disciplineRanks]);

  const createDiscipline = useMutation({
    mutationFn: async (disciplineData: DisciplineFormData) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      const { data, error } = await supabase
        .from('disciplines')
        .insert([{
          ...disciplineData,
          gym_id: gymId,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Discipline;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];
      return { previousDisciplines };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      toast({
        title: 'Success',
        description: 'Discipline created successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.createDiscipline');
      logError(appError);
      toast({
        title: 'Error Creating Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const updateDiscipline = useMutation({
    mutationFn: async ({ id, ...disciplineData }: Partial<DisciplineFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('disciplines')
        .update(disciplineData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Discipline;
    },
    onMutate: async (updatedDiscipline) => {
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];

      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.map(d => 
          d.id === updatedDiscipline.id ? { ...d, ...updatedDiscipline } : d
        );
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      toast({
        title: 'Success',
        description: 'Discipline updated successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.updateDiscipline');
      logError(appError);
      toast({
        title: 'Error Updating Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const deleteDiscipline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disciplines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedDisciplineId) => {
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];

      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.filter(d => d.id !== deletedDisciplineId);
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      toast({
        title: 'Success',
        description: 'Discipline deleted successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.deleteDiscipline');
      logError(appError);
      toast({
        title: 'Error Deleting Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const toggleDisciplineStatus = useMutation({
    mutationFn: async (id: string) => {
      const { data: discipline } = await supabase
        .from('disciplines')
        .select('id, is_active')
        .eq('id', id)
        .maybeSingle();

      if (!discipline) throw new Error('Discipline not found');

      const { data, error } = await supabase
        .from('disciplines')
        .update({ is_active: !discipline.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Discipline;
    },
    onMutate: async (toggledDisciplineId) => {
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];

      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.map(d => 
          d.id === toggledDisciplineId 
            ? { ...d, is_active: !d.is_active }
            : d
        );
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      toast({
        title: 'Success',
        description: 'Discipline status updated',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.toggleDisciplineStatus');
      logError(appError);
      toast({
        title: 'Error Updating Status',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const createRank = useMutation({
    mutationFn: async (rankData: RankFormData) => {
      const { data, error } = await supabase
        .from('discipline_ranks')
        .insert([rankData])
        .select()
        .single();

      if (error) throw error;
      return data as DisciplineRank;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineRanksQueryKey });
      toast({
        title: 'Success',
        description: 'Rank created successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.createRank');
      logError(appError);
      toast({
        title: 'Error Creating Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const updateRank = useMutation({
    mutationFn: async ({ id, ...rankData }: Partial<RankFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('discipline_ranks')
        .update(rankData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DisciplineRank;
    },
    onMutate: async (updatedRank) => {
      await queryClient.cancelQueries({ queryKey: disciplineRanksQueryKey });
      const previousRanks = queryClient.getQueryData(disciplineRanksQueryKey) || [];

      queryClient.setQueryData(disciplineRanksQueryKey, (old: DisciplineRank[] = []) => {
        return old.map(r => 
          r.id === updatedRank.id ? { ...r, ...updatedRank } : r
        );
      });

      return { previousRanks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineRanksQueryKey });
      toast({
        title: 'Success',
        description: 'Rank updated successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.updateRank');
      logError(appError);
      toast({
        title: 'Error Updating Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const deleteRank = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discipline_ranks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedRankId) => {
      await queryClient.cancelQueries({ queryKey: disciplineRanksQueryKey });
      const previousRanks = queryClient.getQueryData(disciplineRanksQueryKey) || [];

      queryClient.setQueryData(disciplineRanksQueryKey, (old: DisciplineRank[] = []) => {
        return old.filter(r => r.id !== deletedRankId);
      });

      return { previousRanks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineRanksQueryKey });
      toast({
        title: 'Success',
        description: 'Rank deleted successfully',
      });
    },
    onError: (error: Error) => {
      const appError = handleError(error, 'useDisciplinesData.deleteRank');
      logError(appError);
      toast({
        title: 'Error Deleting Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  const loading = loadingDisciplines || loadingRanks;

  const refetchAll = useCallback(() => {
    refetchDisciplines();
    refetchRanks();
  }, [refetchDisciplines, refetchRanks]);

  return {
    // Data
    disciplines: disciplines || [],
    disciplineRanks: disciplineRanks || [],
    ranksByDiscipline,

    // Loading states
    loadingDisciplines,
    loadingRanks,
    loading,

    // Mutations
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    toggleDisciplineStatus,
    createRank,
    updateRank,
    deleteRank,

    // Error states
    disciplinesError,
    ranksError,

    // Permissions
    canCreate,
    canUpdate,
    canDelete,

    // Utilities
    refetchAll,

    // Cache keys
    cacheKeys: {
      disciplines: disciplinesQueryKey,
      disciplineRanks: disciplineRanksQueryKey,
    },
  };
}
