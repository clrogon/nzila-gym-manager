import { useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, CheckCircle, XCircle, Send, Download, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useInvoicesData, type InvoiceStatus } from '@/hooks/useInvoicesData.tanstack';
import { usePaymentsData } from '@/hooks/usePaymentsData.tanstack';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  issued: { label: 'Emitida', variant: 'default' },
  paid: { label: 'Paga', variant: 'outline' },
  overdue: { label: 'Vencida', variant: 'destructive' },
  void: { label: 'Anulada', variant: 'secondary' },
};

export function InvoicesList() {
  const { currentGym } = useGym();
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const {
    invoices,
    stats,
    loading,
    createInvoice,
    updateInvoiceStatus,
  } = useInvoicesData(currentGym?.id);

  const { members } = usePaymentsData(currentGym?.id);

  const onSubmit = async (data: any) => {
    if (!data.member_id || !data.subtotal) return;
    
    try {
      await createInvoice.mutateAsync({
        member_id: data.member_id,
        subtotal: parseFloat(data.subtotal),
        due_date: data.due_date || undefined,
        notes: data.notes || undefined,
      });
      setIsOpen(false);
      reset();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ' + (currentGym?.currency || 'AOA');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Facturas</h1>
          <p className="text-muted-foreground">Gerir facturação e cobranças</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Criar Factura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Factura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Membro *</Label>
                <Select onValueChange={(v) => setValue('member_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar membro" />
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
                <Label>Valor (antes de IVA) *</Label>
                <Input type="number" step="0.01" {...register('subtotal', { required: true })} />
                <p className="text-xs text-muted-foreground mt-1">14% IVA será adicionado</p>
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input type="date" {...register('due_date')} />
              </div>
              <div>
                <Label>Notas</Label>
                <Input {...register('notes')} placeholder="Notas opcionais" />
              </div>
              <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
                {createInvoice.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Factura
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
                <p className="text-sm text-muted-foreground">Total Facturas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats.issued}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Vencidas</p>
              <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Cobrado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura #</TableHead>
              <TableHead>Membro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Criada</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.member?.full_name || 'Desconhecido'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[invoice.status].variant}>
                      {STATUS_CONFIG[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell>
                    {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'issued' })}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Emitir
                          </DropdownMenuItem>
                        )}
                        {['issued', 'overdue'].includes(invoice.status) && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'paid' })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar Paga
                          </DropdownMenuItem>
                        )}
                        {!['paid', 'void'].includes(invoice.status) && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'void' })}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Anular
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma factura encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}