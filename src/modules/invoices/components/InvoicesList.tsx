import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, FileText, Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void';

type Invoice = {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  member: {
    id: string;
    full_name: string;
  };
};

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  issued: { label: 'Issued', variant: 'default' },
  paid: { label: 'Paid', variant: 'outline' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  void: { label: 'Void', variant: 'secondary' },
};

export function InvoicesList() {
  const { currentGym } = useGym();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*, member:members(id, full_name)')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!currentGym?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members-list', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('gym_id', currentGym.id)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentGym?.id,
  });

  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      const subtotal = parseFloat(data.subtotal) || 0;
      const tax = subtotal * 0.14;
      const total = subtotal + tax;
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from('invoices').insert({
        gym_id: currentGym!.id,
        member_id: data.member_id,
        invoice_number: invoiceNumber,
        status: 'draft',
        subtotal,
        tax,
        total,
        due_date: data.due_date || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
      setIsOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: any = { status };
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }
      const { error } = await supabase.from('invoices').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated');
    },
  });

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalValue: invoices.filter(i => i.status !== 'void').reduce((sum, i) => sum + i.total, 0),
    paidValue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  };

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage billing and invoices</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((data) => createInvoice.mutate(data))} className="space-y-4">
              <div>
                <Label>Member *</Label>
                <Select onValueChange={(v) => setValue('member_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (before tax) *</Label>
                <Input type="number" step="0.01" {...register('subtotal', { required: true })} />
                <p className="text-xs text-muted-foreground mt-1">14% VAT will be added</p>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" {...register('due_date')} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input {...register('notes')} />
              </div>
              <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
                Create Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.issued}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold text-green-600">{stats.paidValue.toLocaleString()} AOA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.member?.full_name}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[invoice.status].variant}>
                    {STATUS_CONFIG[invoice.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {invoice.total.toLocaleString()} AOA
                </TableCell>
                <TableCell>
                  {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {invoice.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: invoice.id, status: 'issued' })}
                      >
                        Issue
                      </Button>
                    )}
                    {invoice.status === 'issued' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600"
                        onClick={() => updateStatus.mutate({ id: invoice.id, status: 'paid' })}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                    {!['paid', 'void'].includes(invoice.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => updateStatus.mutate({ id: invoice.id, status: 'void' })}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No invoices yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
