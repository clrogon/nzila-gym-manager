import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Financial summary data for a member
 */
export interface MemberFinancialSummary {
  outstandingBalance: number;
  totalPaid: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  pendingPaymentsCount: number;
  completedPaymentsCount: number;
  pendingInvoicesCount: number;
}

/**
 * Hook for fetching member financial summary data
 */
export function useMemberFinancialSummary(memberId: string | undefined, gymId: string | undefined) {
  return useQuery<MemberFinancialSummary>({
    queryKey: ['member-financial-summary', memberId, gymId],
    queryFn: async () => {
      if (!memberId || !gymId) {
        return {
          outstandingBalance: 0,
          totalPaid: 0,
          lastPaymentDate: null,
          lastPaymentAmount: null,
          pendingPaymentsCount: 0,
          completedPaymentsCount: 0,
          pendingInvoicesCount: 0,
        };
      }

      // Fetch all payments for the member
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_status, paid_at, created_at')
        .eq('member_id', memberId)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch pending invoices
      const { count: pendingInvoicesCount, error: invoicesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .eq('gym_id', gymId)
        .in('status', ['issued', 'overdue']);

      if (invoicesError) throw invoicesError;

      const completedPayments = payments?.filter(p => p.payment_status === 'completed') || [];
      const pendingPayments = payments?.filter(p => p.payment_status === 'pending') || [];

      const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Get last completed payment
      const lastPayment = completedPayments[0];

      return {
        outstandingBalance,
        totalPaid,
        lastPaymentDate: lastPayment?.paid_at || lastPayment?.created_at || null,
        lastPaymentAmount: lastPayment?.amount || null,
        pendingPaymentsCount: pendingPayments.length,
        completedPaymentsCount: completedPayments.length,
        pendingInvoicesCount: pendingInvoicesCount || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!memberId && !!gymId,
  });
}

/**
 * Gym-wide financial summary
 */
export interface GymFinancialSummary {
  totalRevenue: number;
  thisMonthRevenue: number;
  pendingPayments: number;
  overdueInvoices: number;
  averageTransactionValue: number;
  transactionCount: number;
  revenueByMethod: Record<string, number>;
}

/**
 * Hook for fetching gym-wide financial summary
 */
export function useGymFinancialSummary(gymId: string | undefined) {
  return useQuery<GymFinancialSummary>({
    queryKey: ['gym-financial-summary', gymId],
    queryFn: async () => {
      if (!gymId) {
        return {
          totalRevenue: 0,
          thisMonthRevenue: 0,
          pendingPayments: 0,
          overdueInvoices: 0,
          averageTransactionValue: 0,
          transactionCount: 0,
          revenueByMethod: {},
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Fetch all completed payments
      const { data: allPayments, error: allError } = await supabase
        .from('payments')
        .select('amount, payment_method, payment_status, created_at')
        .eq('gym_id', gymId)
        .eq('payment_status', 'completed');

      if (allError) throw allError;

      // Fetch this month's payments
      const { data: monthPayments, error: monthError } = await supabase
        .from('payments')
        .select('amount')
        .eq('gym_id', gymId)
        .eq('payment_status', 'completed')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (monthError) throw monthError;

      // Fetch pending payments amount
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('payments')
        .select('amount')
        .eq('gym_id', gymId)
        .eq('payment_status', 'pending');

      if (pendingError) throw pendingError;

      // Fetch overdue invoices count
      const { count: overdueCount, error: overdueError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
        .eq('status', 'overdue');

      if (overdueError) throw overdueError;

      const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const thisMonthRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pendingAmount = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const transactionCount = allPayments?.length || 0;

      // Calculate revenue by payment method
      const revenueByMethod: Record<string, number> = {};
      allPayments?.forEach(p => {
        revenueByMethod[p.payment_method] = (revenueByMethod[p.payment_method] || 0) + p.amount;
      });

      return {
        totalRevenue,
        thisMonthRevenue,
        pendingPayments: pendingAmount,
        overdueInvoices: overdueCount || 0,
        averageTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
        transactionCount,
        revenueByMethod,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!gymId,
  });
}
