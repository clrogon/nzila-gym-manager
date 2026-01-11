import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Wallet, 
  CreditCard, 
  Receipt,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export default function MemberFinances() {
  const { user } = useAuth();
  const { currentGym } = useGym();

  // Fetch member data
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-profile', user?.id, currentGym?.id],
    queryFn: async () => {
      if (!user || !currentGym) return null;
      
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!currentGym,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['member-payments', memberData?.id],
    queryFn: async () => {
      if (!memberData?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, currency, payment_method, payment_status, description, paid_at, created_at')
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!memberData?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['member-invoices', memberData?.id],
    queryFn: async () => {
      if (!memberData?.id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total, status, due_date, created_at')
        .eq('member_id', memberData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!memberData?.id,
    staleTime: 2 * 60 * 1000,
  });

  const loading = memberLoading || paymentsLoading || invoicesLoading;

  const formatCurrency = (amount: number, currency: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
      completed: { variant: 'default', label: 'Pago', icon: <CheckCircle className="w-3 h-3" /> },
      pending: { variant: 'secondary', label: 'Pendente', icon: <Clock className="w-3 h-3" /> },
      failed: { variant: 'destructive', label: 'Falhado', icon: <AlertCircle className="w-3 h-3" /> },
      refunded: { variant: 'outline', label: 'Reembolsado', icon: null },
    };
    
    const { variant, label, icon } = config[status] || { variant: 'outline' as const, label: status, icon: null };
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        {icon}
        {label}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Rascunho' },
      issued: { variant: 'secondary', label: 'Emitida' },
      paid: { variant: 'default', label: 'Paga' },
      overdue: { variant: 'destructive', label: 'Vencida' },
      void: { variant: 'outline', label: 'Anulada' },
    };
    
    const { variant, label } = config[status] || { variant: 'outline' as const, label: status };
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      transfer: 'Transferência',
      bank_transfer: 'Transferência',
      multicaixa: 'Multicaixa',
      pos: 'POS',
      other: 'Outro',
    };
    return labels[method] || method;
  };

  // Calculate financial summary
  const outstandingBalance = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!memberData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Perfil Não Encontrado</h2>
          <p className="text-muted-foreground">
            O seu perfil de membro ainda não foi criado.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">
            Histórico financeiro e facturas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Saldo Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(outstandingBalance, currentGym?.currency || 'AOA')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid, currentGym?.currency || 'AOA')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Histórico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum pagamento registado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: pt })}
                        </TableCell>
                        <TableCell>{payment.description || 'Pagamento'}</TableCell>
                        <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount, payment.currency || currentGym?.currency || 'AOA')}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.payment_status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Facturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma factura disponível</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: pt })}
                        </TableCell>
                        <TableCell>
                          {invoice.due_date
                            ? format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: pt })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.total, currentGym?.currency || 'AOA')}
                        </TableCell>
                        <TableCell>
                          {getInvoiceStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}