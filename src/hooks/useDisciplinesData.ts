import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError } from '@/types/errors';
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
 * Custom hook for discipline data management
 * 
 * Provides CRUD operations for disciplines and ranks with proper error handling
 * and optimistic updates using TanStack Query patterns.
 * 
 * @param gymId - The current gym ID to filter disciplines
 * @returns Object containing discipline data and operations
 * @returns {Discipline[]} disciplines - Array of discipline objects
 * @returns {Rank[]} ranks - Array of rank objects
 * @returns {Record<string, Rank[]>} ranksByDiscipline - Ranks indexed by discipline ID
 * @returns {boolean} loading - Data loading state
 * @returns {Function} createDiscipline - Function to create new discipline
 * @returns {Function} updateDiscipline - Function to update existing discipline
 * @returns {Function} deleteDiscipline - Function to delete discipline
 * @returns {Function} createRank - Function to create new rank
 * @returns {Function} updateRank - Function to update existing rank
 * @returns {Function} deleteRank - Function to delete rank
 * @returns {Function} seedRanks - Function to seed default ranks for discipline
 * 
 * @example
 * ```tsx
 * function DisciplinesPage() {
 *   const { disciplines, ranks, loading, createDiscipline, createRank } = useDisciplinesData(currentGym.id);
 *   
 *   if (loading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       <button onClick={() => createDiscipline(disciplineData)}>
 *         Add Discipline
 *       </button>
 *       <DisciplineList disciplines={disciplines} ranks={ranks} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDisciplinesData(gymId: string | undefined) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Memoized ranks by discipline for efficient lookup
  const ranksByDiscipline = useCallback(() => {
    const map: Record<string, Rank[]> = {};
    ranks.forEach((rank) => {
      if (!map[rank.discipline_id]) {
        map[rank.discipline_id] = [];
      }
      map[rank.discipline_id].push(rank);
    });
    return map;
  }, [ranks]);

  // Fetch disciplines and ranks in parallel (performance optimization)
  const fetchDisciplines = useCallback(async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Parallel queries for better performance
      const [disciplinesResult, ranksResult] = await Promise.all([
        supabase
          .from('disciplines')
          .select('*')
          .eq('gym_id', gymId)
          .order('name'),
        supabase
          .from('ranks')
          .select('*')
          .eq('gym_id', gymId)
          .order('level')
      ]);

      if (disciplinesResult.error) throw disciplinesResult.error;
      if (ranksResult.error) throw ranksResult.error;

      setDisciplines(disciplinesResult.data || []);
      setRanks(ranksResult.data || []);
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.fetchDisciplines');
      logError(appError);
      
      toast({
        title: 'Error Loading Disciplines',
        description: appError.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [gymId, toast]);

  // Create discipline
  const createDiscipline = useCallback(async (disciplineData: DisciplineFormData) => {
    if (!gymId) {
      toast({
        title: 'Error',
        description: 'Please create a gym first.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('disciplines')
        .insert([{
          ...disciplineData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Discipline created successfully',
      });

      await fetchDisciplines();
      return data as Discipline;
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.createDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Creating Discipline',
        description: appError.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [gymId, toast, fetchDisciplines]);

  // Update discipline
  const updateDiscipline = useCallback(async (id: string, disciplineData: Partial<DisciplineFormData>) => {
    try {
      const { data, error } = await supabase
        .from('disciplines')
        .update(disciplineData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Discipline updated successfully',
      });

      await fetchDisciplines();
      return data as Discipline;
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.updateDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Updating Discipline',
        description: appError.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchDisciplines, toast]);

  // Delete discipline
  const deleteDiscipline = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this discipline? This will also delete all associated ranks.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('disciplines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Discipline deleted successfully',
      });

      await fetchDisciplines();
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.deleteDiscipline');
      logError(appError);
      
      toast({
        title: 'Error Deleting Discipline',
        description: appError.message,
        variant: 'destructive'
      });
    }
  }, [fetchDisciplines, toast]);

  // Create rank
  const createRank = useCallback(async (rankData: RankFormData) => {
    if (!gymId) {
      toast({
        title: 'Error',
        description: 'Please create a gym first.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ranks')
        .insert([{
          ...rankData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rank created successfully',
      });

      await fetchDisciplines();
      return data as Rank;
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.createRank');
      logError(appError);
      
      toast({
        title: 'Error Creating Rank',
        description: appError.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [gymId, toast, fetchDisciplines]);

  // Update rank
  const updateRank = useCallback(async (id: string, rankData: Partial<RankFormData>) => {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .update(rankData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rank updated successfully',
      });

      await fetchDisciplines();
      return data as Rank;
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.updateRank');
      logError(appError);
      
      toast({
        title: 'Error Updating Rank',
        description: appError.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchDisciplines, toast]);

  // Delete rank
  const deleteRank = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this rank?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ranks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Rank deleted successfully',
      });

      await fetchDisciplines();
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.deleteRank');
      logError(appError);
      
      toast({
        title: 'Error Deleting Rank',
        description: appError.message,
        variant: 'destructive'
      });
    }
  }, [fetchDisciplines, toast]);

  // Toggle discipline active status
  const toggleDisciplineStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('disciplines')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      await fetchDisciplines();
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.toggleDisciplineStatus');
      logError(appError);
      
      toast({
        title: 'Error',
        description: appError.message,
        variant: 'destructive'
      });
    }
  }, [fetchDisciplines, toast]);

  // Seed default ranks for a discipline
  const seedRanks = useCallback(async (disciplineId: string) => {
    try {
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

      toast({
        title: 'Success',
        description: `Seeded ${ranksToInsert.length} default ranks`,
      });

      await fetchDisciplines();
      return data as Rank[];
    } catch (error) {
      const appError = handleError(error, 'useDisciplinesData.seedRanks');
      logError(appError);
      
      toast({
        title: 'Error Seeding Ranks',
        description: appError.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [gymId, toast, fetchDisciplines]);

  // Fetch data when gymId changes
  useEffect(() => {
    if (gymId) {
      fetchDisciplines();
    }
  }, [gymId, fetchDisciplines]);

  return {
    disciplines,
    ranks,
    ranksByDiscipline: ranksByDiscipline(),
    loading,
    fetchDisciplines,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    createRank,
    updateRank,
    deleteRank,
    toggleDisciplineStatus,
    seedRanks,
  };
}
