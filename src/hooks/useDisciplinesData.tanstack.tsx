import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Discipline type
 */
export interface Discipline {
  id: string;
  name: string;
  description: string;
  category: string;
  equipment: string | null;
  instructor_profile: string | null;
  gym_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Rank type
 */
export interface Rank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string;
  requirements: string | null;
  gym_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Discipline form data type
 */
export interface DisciplineFormData {
  name: string;
  description: string;
  category: string;
  equipment: string;
  instructor_profile: string;
}

/**
 * Rank form data type
 */
export interface RankFormData {
  discipline_id: string;
  name: string;
  level: number;
  color: string;
  requirements: string;
}

/**
 * Custom hook for discipline and rank data management using TanStack Query
 * 
 * Provides efficient caching, automatic refetching, and optimistic updates
 * 
 * @param gymId - The current gym ID to filter disciplines
 * @returns Object containing discipline and rank data, loading states, and CRUD operations
 * @returns {Discipline[]} disciplines - Array of discipline objects (cached)
 * @returns {Rank[]} ranks - Array of rank objects (cached)
 * @returns {Record<string, Rank[]>} ranksByDiscipline - Ranks indexed by discipline ID (memoized)
 * @returns {boolean} loading - Data loading state
 * @returns {Function} createDiscipline - Mutation to create new discipline
 * @returns {Function} updateDiscipline - Mutation to update existing discipline
 * @returns {Function} deleteDiscipline - Mutation to delete discipline
 * @returns {Function} createRank - Mutation to create new rank
 * @returns {Function} updateRank - Mutation to update existing rank
 * @returns {Function} deleteRank - Mutation to delete rank
 * @returns {Function} toggleDisciplineStatus - Mutation to toggle discipline active status
 * @returns {Function} seedRanks - Mutation to seed default ranks for discipline
 * 
 * @example
 * ```tsx
 * function DisciplinesPage() {
 *   const { 
 *     disciplines, 
 *     ranks, 
 *     loading, 
 *     createDiscipline, 
 *     createRank 
 *   } = useDisciplinesData(currentGym.id);
 *   
 *   if (loading) return <Loading />;
 *   
 *   const handleCreate = async (disciplineData: DisciplineFormData) => {
 *     await createDiscipline(disciplineData);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => createDiscipline({ ...disciplineData })}>
 *         Add Discipline
 *       </button>
 *       <DisciplineList disciplines={disciplines} ranks={ranks} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDisciplinesData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  // Cache keys
  const disciplinesQueryKey = ['disciplines', gymId] as const;
  const ranksQueryKey = ['ranks', gymId] as const;
  const ranksByDisciplineQueryKey = (disciplineId: string) => ['ranks', gymId, disciplineId] as const;

  // Fetch disciplines
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
      return data || [];
    },
    // Cache disciplines for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch ranks
  const {
    data: ranks,
    isLoading: loadingRanks,
    error: ranksError,
    refetch: refetchRanks,
  } = useQuery({
    queryKey: ranksQueryKey,
    queryFn: async () => {
      if (!gymId) return [];
      
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('gym_id', gymId)
        .order('discipline_id')
        .order('level');

      if (error) throw error;
      return data || [];
    },
    // Cache ranks for 15 minutes
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch ranks by discipline for efficient lookups
  const {
    data: ranksByDisciplineData,
    isLoading: loadingRanksByDiscipline,
  } = useQuery({
    queryKey: ranksByDisciplineQueryKey(gymId || 'all'),
    queryFn: async () => {
      if (!gymId) return {};
      
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('gym_id', gymId)
        .order('discipline_id')
        .order('level');

      if (error) throw error;
      
      // Group ranks by discipline ID
      const map: Record<string, Rank[]> = {};
      (data || []).forEach((rank) => {
        if (!map[rank.discipline_id]) {
          map[rank.discipline_id] = [];
        }
        map[rank.discipline_id].push(rank);
      });
      
      return map;
    },
    // Cache for 15 minutes
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Memoize ranks by discipline for efficient lookups
  const ranksByDiscipline = useMemo(() => {
    const map: Record<string, Rank[]> = {};
    (ranks || []).forEach((rank) => {
      if (!map[rank.discipline_id]) {
        map[rank.discipline_id] = [];
      }
      map[rank.discipline_id].push(rank);
    });
    return map;
  }, [ranks]);

  // Create discipline mutation with optimistic update
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
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Discipline;
    },
    onMutate: async (newDiscipline) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });

      // Snapshot previous value
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];
      
      // Optimistically add new discipline to cache
      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return [...old, newDiscipline];
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Discipline created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.createDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Creating Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update discipline mutation with optimistic update
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });

      // Snapshot previous value
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];
      
      // Optimistically update discipline in cache
      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.map(d => 
          d.id === updatedDiscipline.id ? { ...d, ...updatedDiscipline } : d
        );
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Discipline updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.updateDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Updating Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete discipline mutation with optimistic update
  const deleteDiscipline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disciplines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedDisciplineId) => {
      // Cancel outgoing refatches
      await queryClient.cancelQueries({ queryKey: disciplinesQueryKey });

      // Snapshot previous value
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];
      
      // Optimistically remove discipline from cache
      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.filter(d => d.id !== deletedDisciplineId);
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Discipline deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.deleteDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Deleting Discipline',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Toggle discipline active status
  const toggleDisciplineStatus = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('disciplines')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Discipline;
    },
    onMutate: async (toggledDiscipline) => {
      // Snapshot previous value
      const previousDisciplines = queryClient.getQueryData(disciplinesQueryKey) || [];
      
      // Optimistically update status
      queryClient.setQueryData(disciplinesQueryKey, (old: Discipline[] = []) => {
        return old.map(d => 
          d.id === toggledDiscipline.id 
            ? { ...d, is_active: !d.is_active }
            : d
        );
      });

      return { previousDisciplines };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: disciplinesQueryKey });
      
      toast({
        title: 'Success',
        description: 'Discipline status updated',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.toggleDisciplineStatus');
      logError(appError);
      
      toast({
        title: 'Error Updating Status',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Create rank mutation
  const createRank = useMutation({
    mutationFn: async (rankData: RankFormData) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      const { data, error } = await supabase
        .from('ranks')
        .insert([{
          ...rankData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Rank;
    },
    onMutate: async (newRank) => {
      // Snapshot previous value
      const previousRanks = queryClient.getQueryData(ranksQueryKey) || [];
      
      // Optimistically add new rank to cache
      queryClient.setQueryData(ranksQueryKey, (old: Rank[] = []) => {
        return [...old, newRank];
      });

      return { previousRanks };
    },
    onSuccess: (_, variables) => {
      // Invalidate both ranks and ranks-by-discipline queries
      queryClient.invalidateQueries({ queryKey: ranksQueryKey });
      queryClient.invalidateQueries({ queryKey: ['ranks', gymId, variables.discipline_id] });
      
      toast({
        title: 'Success',
        description: 'Rank created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.createRank');
      logError(appError);
      
      toast({
        title: 'Error Creating Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update rank mutation
  const updateRank = useMutation({
    mutationFn: async ({ id, ...rankData }: Partial<RankFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('ranks')
        .update(rankData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Rank;
    },
    onMutate: async (updatedRank) => {
      // Snapshot previous value
      const previousRanks = queryClient.getQueryData(ranksQueryKey) || [];
      
      // Optimistically update rank in cache
      queryClient.setQueryData(ranksQueryKey, (old: Rank[] = []) => {
        return old.map(r => 
          r.id === updatedRank.id ? { ...r, ...updatedRank } : r
        );
      });

      return { previousRanks };
    },
    onSuccess: (_, variables) => {
      // Invalidate both ranks and ranks-by-discipline queries
      queryClient.invalidateQueries({ queryKey: ranksQueryKey });
      const updatedRank = variables as { id: string } & RankFormData;
      if (updatedRank.discipline_id) {
        queryClient.invalidateQueries({ queryKey: ['ranks', gymId, updatedRank.discipline_id] });
      }
      
      toast({
        title: 'Success',
        description: 'Rank updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.updateRank');
      logError(appError);
      
      toast({
        title: 'Error Updating Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete rank mutation
  const deleteRank = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ranks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedRankId) => {
      // Snapshot previous value
      const previousRanks = queryClient.getQueryData(ranksQueryKey) || [];
      
      // Optimistically remove rank from cache
      queryClient.setQueryData(ranksQueryKey, (old: Rank[] = []) => {
        return old.filter(r => r.id !== deletedRankId);
      });

      return { previousRanks };
    },
    onSuccess: () => {
      // Invalidate both ranks and ranks-by-discipline queries
      queryClient.invalidateQueries({ queryKey: ranksQueryKey });
      queryClient.invalidateQueries({ queryKey: ['ranks', gymId] });
      
      toast({
        title: 'Success',
        description: 'Rank deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.deleteRank');
      logError(appError);
      
      toast({
        title: 'Error Deleting Rank',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Seed default ranks mutation
  const seedRanks = useMutation({
    mutationFn: async (disciplineId: string) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      // Default rank templates from seedData
      const defaultRanks = [
        { name: 'White Belt', level: 1, color: '#FFFFFF', requirements: 'Beginner' },
        { name: 'Blue Belt', level: 2, color: '#1E40AF', requirements: '2+ years training' },
        { name: 'Purple Belt', level: 3, color: '#7C3AED', requirements: '5+ years training' },
        { name: 'Brown Belt', level: 4, color: '#78350F', requirements: '7+ years training' },
        { name: 'Black Belt', level: 5, color: '#000000', requirements: '10+ years training' },
      ];

      const ranksToInsert = defaultRanks.map((rank) => ({
        ...rank,
        discipline_id: disciplineId,
        gym_id: gymId!
      }));

      const { data, error } = await supabase
        .from('ranks')
        .insert(ranksToInsert)
        .select();

      if (error) throw error;
      return data as Rank[];
    },
    onMutate: async () => {
      // Invalidate ranks queries
      queryClient.invalidateQueries({ queryKey: ranksQueryKey });
      queryClient.invalidateQueries({ queryKey: ['ranks', gymId] });
    },
    onSuccess: (createdRanks) => {
      queryClient.invalidateQueries({ queryKey: ['ranks', gymId] });
      
      toast({
        title: 'Success',
        description: `Seeded ${createdRanks.length} default ranks`,
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useDisciplinesData.seedRanks');
      logError(appError);
      
      toast({
        title: 'Error Seeding Ranks',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    },
  });

  // Combined loading state
  const loading = loadingDisciplines || loadingRanks;

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchDisciplines();
    refetchRanks();
  }, [refetchDisciplines, refetchRanks]);

  return {
    // Data
    disciplines: disciplines || [],
    ranks: ranks || [],
    ranksByDiscipline,
    loadingDisciplines,
    loadingRanks,
    loading,

    // Mutations
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    createRank,
    updateRank,
    deleteRank,
    toggleDisciplineStatus,
    seedRanks,

    // Error states
    disciplinesError,
    ranksError,

    // Cache utilities (aliases for backward compatibility)
    fetchDisciplines: refetchDisciplines,
    refetchAll,

    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      disciplines: disciplinesQueryKey,
      ranks: ranksQueryKey,
      ranksByDiscipline: (disciplineId: string) => ['ranks', gymId, disciplineId],
    },
  };
}
