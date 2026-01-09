import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';
import { subDays, startOfMonth } from 'date-fns';

/**
 * Member type
 */
export interface Member {
  id: string;
  full_name: string;
  email: string | null;
}

/**
 * WorkoutAssignment type
 */
export interface WorkoutAssignment {
  id: string;
  assigned_date: string;
  completed_at: string | null;
  workout_template: {
    name: string;
    category: string | null;
  } | null;
}

/**
 * RankPromotion type
 */
export interface RankPromotion {
  id: string;
  promotion_date: string;
  notes: string | null;
  discipline: { name: string } | null;
  from_rank: { name: string; color: string | null } | null;
  to_rank: { name: string; color: string | null } | null;
}

/**
 * PerformanceRecord type
 */
export interface PerformanceRecord {
  id: string;
  exercise_name: string;
  value: number;
  unit: string;
  is_pr: boolean;
  recorded_at: string;
}

/**
 * Custom hook for member progress data management using TanStack Query
 *
 * Provides efficient caching, automatic refetching, and optimistic updates
 *
 * @param gymId - The current gym ID to filter data
 * @param memberId - The selected member ID to fetch progress for
 * @param dateRange - Date range filter: 'week' | 'month' | 'all'
 * @returns Object containing member progress data, loading states, and CRUD operations
 * @returns {Member[]} members - Array of active members (cached)
 * @returns {WorkoutAssignment[]} assignments - Member's workout assignments (cached)
 * @returns {RankPromotion[]} promotions - Member's rank promotions (cached)
 * @returns {PerformanceRecord[]} performanceRecords - Member's performance records (cached)
 * @returns {boolean} loadingMembers - Members data loading state
 * @returns {boolean} loadingProgress - Progress data loading state
 * @returns {Function} refetchAll - Function to manually refetch all data
 *
 * @example
 * ```tsx
 * function MemberProgressDashboard() {
 *   const { members, assignments, promotions, loading } = useMemberProgressData(currentGym.id, selectedMember, 'month');
 *
 *   if (loading) return <Loading />;
 *
 *   return (
 *     <div>
 *       <Select value={selectedMember} onValueChange={setSelectedMember}>
 *         {members.map(member => (
 *           <SelectItem key={member.id} value={member.id}>
 *             {member.full_name}
 *           </SelectItem>
 *         ))}
 *       </Select>
 *       <WorkoutList assignments={assignments} />
 *       <PromotionList promotions={promotions} />
 *       <PerformanceList records={performanceRecords} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemberProgressData(
  gymId: string | undefined,
  memberId: string | undefined,
  dateRange: 'week' | 'month' | 'all'
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cache keys
  const membersQueryKey = ['members', gymId, 'active'] as const;
  const assignmentsQueryKey = ['member_workouts', gymId, memberId, dateRange] as const;
  const promotionsQueryKey = ['rank_promotions', gymId, memberId] as const;
  const performanceRecordsQueryKey = ['performance_records', gymId, memberId, dateRange] as const;

  // Calculate date filter based on dateRange
  const dateFilter = useMemo(() => {
    if (dateRange === 'week') return subDays(new Date(), 7);
    if (dateRange === 'month') return startOfMonth(new Date());
    return new Date(0);
  }, [dateRange]);

  // Fetch active members with TanStack Query
  const {
    data: members,
    isLoading: loadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, email')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    // Cache for 5 minutes (members change moderately)
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Don't refetch on window focus (reduces unnecessary requests)
    refetchOnWindowFocus: false,
    // Only retry once on failure
    retry: 1,
    // Only fetch if gymId is available
    enabled: !!gymId,
  });

  // Fetch member workout assignments with TanStack Query
  const {
    data: assignments,
    isLoading: loadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: assignmentsQueryKey,
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('member_workouts')
        .select(`
          id,
          assigned_date,
          completed_at,
          workout_template:workout_templates(name, category)
        `)
        .eq('member_id', memberId)
        .gte('assigned_date', dateFilter.toISOString().split('T')[0])
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkoutAssignment[];
    },
    // Cache for 5 minutes (assignments change frequently)
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId && !!memberId,
  });

  // Fetch member rank promotions with TanStack Query
  const {
    data: promotions,
    isLoading: loadingPromotions,
    error: promotionsError,
    refetch: refetchPromotions,
  } = useQuery({
    queryKey: promotionsQueryKey,
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('rank_promotions')
        .select(`
          id,
          promotion_date,
          notes,
          discipline:disciplines(name),
          from_rank:discipline_ranks!rank_promotions_from_rank_id_fkey(name, color),
          to_rank:discipline_ranks!rank_promotions_to_rank_id_fkey(name, color)
        `)
        .eq('member_id', memberId)
        .order('promotion_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as RankPromotion[];
    },
    // Cache for 10 minutes (promotions are stable)
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId && !!memberId,
  });

  // Fetch member performance records with TanStack Query
  const {
    data: performanceRecords,
    isLoading: loadingPerformance,
    error: performanceError,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: performanceRecordsQueryKey,
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('performance_records')
        .select('*')
        .eq('member_id', memberId)
        .gte('recorded_at', dateFilter.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as PerformanceRecord[];
    },
    // Cache for 5 minutes (performance records change frequently)
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId && !!memberId,
  });

  // Refetch all data
  const refetchAll = useCallback(() => {
    if (gymId) {
      refetchMembers();
    }
    if (memberId) {
      refetchAssignments();
      refetchPromotions();
      refetchPerformance();
    }
  }, [
    gymId,
    memberId,
    refetchMembers,
    refetchAssignments,
    refetchPromotions,
    refetchPerformance,
  ]);

  return {
    // Data
    members: members || [],
    assignments: assignments || [],
    promotions: promotions || [],
    performanceRecords: performanceRecords || [],

    // Loading states
    loadingMembers,
    loadingAssignments,
    loadingPromotions,
    loadingPerformance,
    loadingProgress: loadingMembers || loadingAssignments || loadingPromotions || loadingPerformance,

    // Error states
    membersError,
    assignmentsError,
    promotionsError,
    performanceError,

    // Cache utilities
    refetchAll,

    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      members: membersQueryKey,
      assignments: assignmentsQueryKey,
      promotions: promotionsQueryKey,
      performanceRecords: performanceRecordsQueryKey,
    },
  };
}
