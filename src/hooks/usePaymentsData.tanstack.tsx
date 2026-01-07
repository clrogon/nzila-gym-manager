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

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

export interface Payment {
  id: string;
  member_id: string;
  member_name: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  multicaixa_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface PaymentFormData {
  member_id: string;
  amount: number;
  payment_method: 'multicaixa' | 'cash' | 'bank_transfer' | 'other';
  multicaixa_reference?: string;
  description?: string;
}

export interface Invoice {
  id: string;
  member_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
}

/**
 * Hook for managing payments, members, and plans data
 */
export function usePaymentsData(gymId: string | undefined) {
  const queryClient = useQueryClient();

  const paymentsQueryKey = ['payments', gymId] as const;
  const membersQueryKey = ['members', gymId] as const;
  const plansQueryKey = ['membership-plans', gymId] as const;

  const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: membersQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('gym_id', gymId)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!gymId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
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
    enabled: !!gymId,
  });

  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: paymentsQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      try {
        const { data: paymentsData, error } = await supabase
          .from('payments')
          .select('id, member_id, amount, payment_method, payment_status, multicaixa_reference, description, created_at')
          .eq('gym_id', gymId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        if (paymentsData && paymentsData.length > 0) {
          const memberIds = [...new Set(paymentsData.map(p => p.member_id))];
          const { data: membersData } = await supabase
            .from('members')
            .select('id, full_name')
            .in('id', memberIds);

          const memberMap = new Map(membersData?.map(m => [m.id, m.full_name]));

          return paymentsData.map(p => ({
            ...p,
            member_name: memberMap.get(p.member_id) || 'Unknown',
          }));
        }

        return [];
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!gymId,
  });

  const createPayment = useMutation({
    mutationFn: async (formData: PaymentFormData) => {
      if (!gymId) throw new Error('Gym ID is required');

      const { data, error } = await supabase
        .from('payments')
        .insert([{
          gym_id: gymId,
          member_id: formData.member_id,
          amount: formData.amount,
          payment_method: formData.payment_method,
          payment_status: 'completed' as const,
          multicaixa_reference: formData.payment_method === 'multicaixa' ? formData.multicaixa_reference : null,
          description: formData.description,
          paid_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: paymentsQueryKey });
      const previousPayments = queryClient.getQueryData(paymentsQueryKey);
      return { previousPayments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
      toast({
        title: 'Payment Recorded',
        description: 'The payment has been recorded successfully.',
      });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentsQueryKey, context.previousPayments);
      }
      toast({
        title: 'Error',
        description: 'Failed to record payment.',
        variant: 'destructive',
      });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: paymentsQueryKey });
      const previousPayments = queryClient.getQueryData(paymentsQueryKey);
      queryClient.setQueryData(paymentsQueryKey, (old: Payment[] = []) =>
        old.map(p => p.id === id ? { ...p, ...old } : p)
      );
      return { previousPayments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
      toast({
        title: 'Payment Updated',
        description: 'The payment has been updated successfully.',
      });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentsQueryKey, context.previousPayments);
      }
      toast({
        title: 'Error',
        description: 'Failed to update payment.',
        variant: 'destructive',
      });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: paymentsQueryKey });
      const previousPayments = queryClient.getQueryData(paymentsQueryKey);
      queryClient.setQueryData(paymentsQueryKey, (old: Payment[] = []) =>
        old.filter(p => p.id !== id)
      );
      return { previousPayments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
      toast({
        title: 'Payment Deleted',
        description: 'The payment has been deleted successfully.',
      });
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentsQueryKey, context.previousPayments);
      }
      toast({
        title: 'Error',
        description: 'Failed to delete payment.',
        variant: 'destructive',
      });
    },
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
    queryClient.invalidateQueries({ queryKey: membersQueryKey });
    queryClient.invalidateQueries({ queryKey: plansQueryKey });
  };

  const loading = membersLoading || plansLoading || paymentsLoading;

  return {
    members,
    plans,
    payments,
    loading,
    createPayment,
    updatePayment,
    deletePayment,
    refetchPayments,
    refetchAll,
    cacheKeys: {
      payments: paymentsQueryKey,
      members: membersQueryKey,
      plans: plansQueryKey,
    },
  };
}
