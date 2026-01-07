import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Types
 */
export interface Member {
  id: string;
  full_name: string;
}

export interface CheckIn {
  id: string;
  member_id: string;
  member_name: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

/**
 * Hook for managing check-ins and members data
 */
export function useCheckInsData(gymId: string | undefined) {
  const queryClient = useQueryClient();

  const membersQueryKey = ['members-active', gymId] as const;
  const checkInsQueryKey = ['check-ins-today', gymId] as const;

  const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: membersQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!gymId,
  });

  const { data: checkIns = [], isLoading: checkInsLoading, refetch: refetchCheckIns } = useQuery<CheckIn[]>({
    queryKey: checkInsQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const today = new Date().toISOString().split('T')[0];

      try {
        const { data: checkInsData, error } = await supabase
          .from('check_ins')
          .select('id, member_id, checked_in_at, checked_out_at')
          .eq('gym_id', gymId)
          .gte('checked_in_at', today)
          .order('checked_in_at', { ascending: false });

        if (error) throw error;

        if (checkInsData && checkInsData.length > 0) {
          const memberIds = [...new Set(checkInsData.map(c => c.member_id))];
          const { data: membersData } = await supabase
            .from('members')
            .select('id, full_name')
            .in('id', memberIds);

          const memberMap = new Map(membersData?.map(m => [m.id, m.full_name]));

          return checkInsData.map(c => ({
            ...c,
            member_name: memberMap.get(c.member_id) || 'Desconhecido',
          }));
        }

        return [];
      } catch (error) {
        console.error('Erro ao buscar check-ins:', error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!gymId,
  });

  const checkIn = useMutation({
    mutationFn: async (memberId: string) => {
      if (!gymId) throw new Error('Gym ID is required');

      const { data, error } = await supabase
        .from('check_ins')
        .insert([{
          gym_id: gymId,
          member_id: memberId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: checkInsQueryKey });
      const previousCheckIns = queryClient.getQueryData(checkInsQueryKey);
      return { previousCheckIns };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInsQueryKey });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousCheckIns) {
        queryClient.setQueryData(checkInsQueryKey, context.previousCheckIns);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao registar check-in.',
        variant: 'destructive',
      });
    },
  });

  const checkOut = useMutation({
    mutationFn: async (checkInId: string) => {
      const { data, error } = await supabase
        .from('check_ins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', checkInId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (checkInId) => {
      await queryClient.cancelQueries({ queryKey: checkInsQueryKey });
      const previousCheckIns = queryClient.getQueryData(checkInsQueryKey);
      queryClient.setQueryData(checkInsQueryKey, (old: CheckIn[] = []) =>
        old.map(c => c.id === checkInId ? { ...c, checked_out_at: new Date().toISOString() } : c)
      );
      return { previousCheckIns };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInsQueryKey });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousCheckIns) {
        queryClient.setQueryData(checkInsQueryKey, context.previousCheckIns);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao registar check-out.',
        variant: 'destructive',
      });
    },
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: checkInsQueryKey });
    queryClient.invalidateQueries({ queryKey: membersQueryKey });
  };

  const loading = membersLoading || checkInsLoading;

  return {
    members,
    checkIns,
    loading,
    checkIn,
    checkOut,
    refetchCheckIns,
    refetchAll,
    cacheKeys: {
      members: membersQueryKey,
      checkIns: checkInsQueryKey,
    },
  };
}
