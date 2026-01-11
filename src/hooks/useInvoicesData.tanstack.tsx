import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Invoice status type matching database enum
 */
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void';

/**
 * Invoice type with member relationship
 */
export interface Invoice {
  id: string;
  invoice_number: string;
  member_id: string;
  gym_id: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number | null;
  total: number;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    full_name: string;
  };
}

/**
 * Form data for creating an invoice
 */
export interface InvoiceFormData {
  member_id: string;
  subtotal: number;
  tax_rate?: number; // Default 14%
  due_date?: string;
  notes?: string;
}

/**
 * Hook for managing invoices data with TanStack Query
 */
export function useInvoicesData(gymId: string | undefined) {
  const queryClient = useQueryClient();
  const invoicesQueryKey = ['invoices', gymId] as const;

  /**
   * Fetch all invoices for the gym
   */
  const {
    data: invoices = [],
    isLoading,
    error,
    refetch: refetchInvoices,
  } = useQuery<Invoice[]>({
    queryKey: invoicesQueryKey,
    queryFn: async () => {
      if (!gymId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          member:members(id, full_name)
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Invoice[]) || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!gymId,
  });

  /**
   * Generate a unique invoice number
   */
  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `INV-${timestamp}${random}`;
  };

  /**
   * Create a new invoice
   */
  const createInvoice = useMutation({
    mutationFn: async (formData: InvoiceFormData) => {
      if (!gymId) throw new Error('Gym ID is required');

      const subtotal = formData.subtotal;
      const taxRate = formData.tax_rate ?? 0.14; // Default 14% VAT
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      const invoiceNumber = generateInvoiceNumber();

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          gym_id: gymId,
          member_id: formData.member_id,
          invoice_number: invoiceNumber,
          status: 'draft' as const,
          subtotal,
          tax,
          total,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
        })
        .select(`
          *,
          member:members(id, full_name)
        `)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: invoicesQueryKey });
      return { previousInvoices: queryClient.getQueryData(invoicesQueryKey) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
      toast.success('Factura criada com sucesso');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(invoicesQueryKey, context.previousInvoices);
      }
      toast.error('Erro ao criar factura');
      console.error('Error creating invoice:', error);
    },
  });

  /**
   * Update invoice status
   */
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: Record<string, unknown> = { status };
      
      // Set paid_at when marking as paid
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          member:members(id, full_name)
        `)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: invoicesQueryKey });
      const previousInvoices = queryClient.getQueryData<Invoice[]>(invoicesQueryKey);
      
      queryClient.setQueryData<Invoice[]>(invoicesQueryKey, (old = []) =>
        old.map(inv => 
          inv.id === id 
            ? { ...inv, status, ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}) }
            : inv
        )
      );
      
      return { previousInvoices };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
      const statusMessages: Record<InvoiceStatus, string> = {
        draft: 'Factura guardada como rascunho',
        issued: 'Factura emitida',
        paid: 'Factura marcada como paga',
        overdue: 'Factura marcada como vencida',
        void: 'Factura anulada',
      };
      toast.success(statusMessages[data.status] || 'Factura actualizada');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(invoicesQueryKey, context.previousInvoices);
      }
      toast.error('Erro ao actualizar factura');
      console.error('Error updating invoice:', error);
    },
  });

  /**
   * Delete an invoice
   */
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      // First delete invoice items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      
      // Then delete the invoice
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: invoicesQueryKey });
      const previousInvoices = queryClient.getQueryData<Invoice[]>(invoicesQueryKey);
      
      queryClient.setQueryData<Invoice[]>(invoicesQueryKey, (old = []) =>
        old.filter(inv => inv.id !== id)
      );
      
      return { previousInvoices };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
      toast.success('Factura eliminada');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(invoicesQueryKey, context.previousInvoices);
      }
      toast.error('Erro ao eliminar factura');
      console.error('Error deleting invoice:', error);
    },
  });

  /**
   * Calculate invoice statistics
   */
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    void: invoices.filter(i => i.status === 'void').length,
    totalValue: invoices
      .filter(i => !['void', 'draft'].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0),
    paidValue: invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0),
    pendingValue: invoices
      .filter(i => ['issued', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0),
  };

  return {
    invoices,
    stats,
    loading: isLoading,
    error,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    refetchInvoices,
    cacheKey: invoicesQueryKey,
  };
}
