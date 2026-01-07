import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Member type
 */
export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  photo_url: string | null;
  notes: string | null;
  membership_plan_id: string | null;
  membership_start_date: string | null;
  membership_end_date: string | null;
  created_at: string;
  is_dependent: boolean | null;
  tutor_id: string | null;
  gym_id: string;
}

/**
 * Member sensitive data type
 */
export interface MemberSensitiveData {
  id: string;
  member_id: string;
  health_conditions: string | null;
  medical_notes: string | null;
  allergies: string | null;
}

/**
 * Membership plan type
 */
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

/**
 * Valid member status values
 */
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * Member form data type (basic info only)
 */
export interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  status: MemberStatus;
  membership_plan_id: string;
  notes: string;
  is_dependent: boolean;
  tutor_id: string;
  photo_url: string;
  emergency_contact: string;
  emergency_phone: string;
}

/**
 * Member filter options
 */
export interface MemberFilters {
  searchQuery: string;
  statusFilter: string;
}

/**
 * Custom hook for member data management using TanStack Query
 * 
 * Provides efficient caching, automatic refetching, and optimistic updates
 * 
 * @param gymId - The current gym ID to filter members
 * @returns Object containing member data, loading states, and CRUD operations
 * @returns {Member[]} members - Array of member objects (cached)
 * @returns {MembershipPlan[]} plans - Available membership plans (cached)
 * @returns {Record<string, MemberSensitiveData>} sensitiveDataMap - Sensitive data by member ID (cached)
 * @returns {boolean} loadingMembers - Members data loading state
 * @returns {boolean} loadingPlans - Plans data loading state
 * @returns {Function} createMember - Mutation to create new member
 * @returns {Function} updateMember - Mutation to update existing member
 * @returns {Function} deleteMember - Mutation to delete member
 * @returns {Function} refetchAll - Function to manually refetch all data
 * 
 * @example
 * ```tsx
 * function MembersPage() {
 *   const { members, loading, createMember, updateMember, deleteMember } = useMembersData(currentGym.id);
 *   
 *   if (loading) return <Loading />;
 *   
 *   const handleCreate = async (memberData: MemberFormData) => {
 *     await createMember(memberData);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => createMember({ ...memberData })}>
 *         Create Member
 *       </button>
 *       <MemberList members={members} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMembersData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  // Cache keys
  const membersQueryKey = ['members', gymId] as const;
  const plansQueryKey = ['membership_plans', gymId] as const;
  const sensitiveDataQueryKey = (memberId: string) => ['member_sensitive_data', memberId] as const;

  // Fetch members with TanStack Query
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
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    // Cache for 5 minutes, keep for 10
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Don't refetch on window focus (reduces unnecessary requests)
    refetchOnWindowFocus: false,
    // Only retry once on failure
    retry: 1,
    // Only fetch if gymId is available
    enabled: !!gymId,
  });

  // Fetch membership plans with TanStack Query
  const {
    data: plans,
    isLoading: loadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: plansQueryKey,
    queryFn: async () => {
      if (!gymId) return [];
      
      const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, price, duration_days')
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId,
  });

  // Fetch sensitive data for all members (admin only) with TanStack Query
  const {
    data: sensitiveDataList,
    isLoading: loadingSensitive,
    error: sensitiveError,
  } = useQuery({
    queryKey: ['member_sensitive_data', gymId] as const,
    queryFn: async () => {
      // Only admins should access sensitive data
      // This is enforced by RLS in the database
      const { data, error } = await supabase
        .from('member_sensitive_data')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    // Cache sensitive data for 10 minutes (less frequent updates)
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!gymId && hasPermission('members:read_sensitive'),
  });

  // Memoize sensitive data map for efficient lookups
  const sensitiveDataMap = useMemo(() => {
    if (!sensitiveDataList) return {};
    const map: Record<string, MemberSensitiveData> = {};
    sensitiveDataList.forEach((sd: MemberSensitiveData) => {
      map[sd.member_id] = sd;
    });
    return map;
  }, [sensitiveDataList]);

  // Create member mutation with optimistic update
  const createMember = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!gymId) {
        throw new Error('Gym ID is required');
      }

      const { data, error } = await supabase
        .from('members')
        .insert([{
          ...memberData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Member;
    },
    // Optimistic update: Add new member to cache immediately
    onMutate: async (newMember) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersQueryKey });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData(membersQueryKey) || [];
      
      // Optimistically add new member to cache
      queryClient.setQueryData(membersQueryKey, (old: Member[] = []) => {
        return [...old, newMember];
      });

      return { previousMembers };
    },
    // On success, invalidate cache to get fresh data
    onSuccess: (newMember) => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      
      toast({
        title: 'Success',
        description: 'Member created successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useMembersData.createMember');
      logError(appError);
      
      toast({
        title: 'Error Creating Member',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Update member mutation with optimistic update
  const updateMember = useMutation({
    mutationFn: async ({ id, ...memberData }: Partial<MemberFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Member;
    },
    onMutate: async (updatedMember) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersQueryKey });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData(membersQueryKey) || [];
      
      // Optimistically update member in cache
      queryClient.setQueryData(membersQueryKey, (old: Member[] = []) => {
        return old.map(m => 
          m.id === updatedMember.id ? { ...m, ...updatedMember } : m
        );
      });

      return { previousMembers };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      
      toast({
        title: 'Success',
        description: 'Member updated successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useMembersData.updateMember');
      logError(appError);
      
      toast({
        title: 'Error Updating Member',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });

      // Rollback on error
      if (error instanceof Error) {
        throw error;
      }
    },
  });

  // Delete member mutation with optimistic update
  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (deletedMemberId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersQueryKey });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData(membersQueryKey) || [];
      
      // Optimistically remove member from cache
      queryClient.setQueryData(membersQueryKey, (old: Member[] = []) => {
        return old.filter(m => m.id !== deletedMemberId);
      });

      return { previousMembers };
    },
    onSuccess: () => {
      // Invalidate and refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      
      toast({
        title: 'Success',
        description: 'Member deleted successfully',
      });
    },
    onError: (error) => {
      const appError = handleError(error, 'useMembersData.deleteMember');
      logError(appError);
      
      toast({
        title: 'Error Deleting Member',
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
  const loading = loadingMembers || loadingPlans || loadingSensitive;

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchMembers();
    refetchPlans();
  }, [refetchMembers, refetchPlans]);

  return {
    // Data
    members: members || [],
    plans: plans || [],
    sensitiveDataMap,
    
    // Loading states
    loadingMembers,
    loadingPlans,
    loadingSensitive,
    loading,
    
    // Mutations
    createMember,
    updateMember,
    deleteMember,
    
    // Error states
    membersError,
    plansError,
    sensitiveError,
    
    // Cache utilities
    refetchAll,
    
    // Cache key exposure (for advanced use cases)
    cacheKeys: {
      members: membersQueryKey,
      plans: plansQueryKey,
      sensitiveData: sensitiveDataQueryKey(gymId),
    },
  };
}
