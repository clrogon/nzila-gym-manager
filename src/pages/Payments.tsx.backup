import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, CreditCard, Banknote, Smartphone, Search, FileText, 
  ArrowUpRight, ArrowDownLeft, TrendingUp, Calendar, Receipt,
  Download, Filter, MoreHorizontal, Send, Eye, CheckCircle2
} from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Member {
  id: string;
  full_name: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

interface Payment {
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

interface Invoice {
  id: string;
  member_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
}

export default function Payments() {
  const { currentGym } = useGym();
  const { toast } = useToast();
  const { hasPermission, hasMinimumRole } = useRBAC();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Payment method settings
  const [multicaixaEnabled, setMulticaixaEnabled] = useState(true);
  const [cashEnabled, setCashEnabled] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [multicaixaEntity, setMulticaixaEntity] = useState('');
  const [multicaixaReference, setMulticaixaReference] = useState('');

  // Form state
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('multicaixa');
  const [multicaixaRef, setMulticaixaRef] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Invoice form state
  const [invoiceMemberId, setInvoiceMemberId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');

  // Mock invoices for UI (would be fetched from DB in real implementation)
  const [invoices] = useState<Invoice[]>([
    { id: '1', member_name: 'João Silva', amount: 15000, status: 'paid', due_date: '2024-01-15', created_at: '2024-01-01' },
    { id: '2', member_name: 'Maria Santos', amount: 25000, status: 'sent', due_date: '2024-01-20', created_at: '2024-01-05' },
    { id: '3', member_name: 'Pedro Costa', amount: 15000, status: 'overdue', due_date: '2024-01-10', created_at: '2024-01-01' },
  ]);

  useEffect(() => {
    if (currentGym) {
      fetchMembers();
      fetchPayments();
      fetchPlans();
    }
  }, [currentGym]);

  const fetchMembers = async () => {
    if (!currentGym) return;

    const { data } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('gym_id', currentGym.id)
      .order('full_name');

    setMembers(data || []);
  };

  const fetchPlans = async () => {
    if (!currentGym) return;

    const { data } = await supabase
      .from('membership_plans')
      .select('id, name, price, duration_days')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)
      .order('price');

    setPlans(data || []);
  };

  const fetchPayments = async () => {
    if (!currentGym) return;

    try {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, member_id, amount, payment_method, payment_status, multicaixa_reference, description, created_at')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (paymentsData && paymentsData.length > 0) {
        const memberIds = [...new Set(paymentsData.map(p => p.member_id))];
        const { data: membersData } = await supabase
          .from('members')
          .select('id, full_name')
          .in('id', memberIds);

        const memberMap = new Map(membersData?.map(m => [m.id, m.full_name]));

        setPayments(
          paymentsData.map(p => ({
            ...p,
            member_name: memberMap.get(p.member_id) || 'Unknown',
          }))
        );
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym || !memberId) return;

    try {
      const finalAmount = selectedPlanId 
        ? plans.find(p => p.id === selectedPlanId)?.price || parseFloat(amount)
        : parseFloat(amount);

      const { error } = await supabase.from('payments').insert([{
        gym_id: currentGym.id,
        member_id: memberId,
        amount: finalAmount,
        payment_method: paymentMethod as 'multicaixa' | 'cash' | 'bank_transfer' | 'other',
        payment_status: 'completed' as const,
        multicaixa_reference: paymentMethod === 'multicaixa' ? multicaixaRef : null,
        description: description || (selectedPlanId ? `Plan: ${plans.find(p => p.id === selectedPlanId)?.name}` : null),
        paid_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast({ title: 'Payment Recorded', description: 'The payment has been recorded successfully.' });
      resetForm();
      setDialogOpen(false);
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' });
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    // In real implementation, this would create an invoice in the database
    toast({ title: 'Invoice Created', description: 'Invoice has been created and is ready to send.' });
    setInvoiceDialogOpen(false);
    resetInvoiceForm();
  };

  const resetForm = () => {
    setMemberId('');
    setAmount('');
    setPaymentMethod('multicaixa');
    setMulticaixaRef('');
    setDescription('');
    setSelectedPlanId('');
  };

  const resetInvoiceForm = () => {
    setInvoiceMemberId('');
    setInvoiceAmount('');
    setInvoiceDueDate('');
    setInvoiceDescription('');
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setAmount(plan.price.toString());
      setDescription(`Membership: ${plan.name}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currentGym?.currency || 'AOA',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      paid: 'default',
      pending: 'secondary',
      sent: 'secondary',
      failed: 'destructive',
      overdue: 'destructive',
      refunded: 'outline',
      draft: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'multicaixa':
        return <Smartphone className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  // Calculate stats
  const totalRevenue = payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const thisMonthPayments = payments.filter(p => {
    const date = new Date(p.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Finance</h1>
            <p className="text-muted-foreground">Manage payments, invoices & revenue</p>
          </div>

          <div className="flex gap-2">
            <RequirePermission permission="payments:create">
              <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvoice} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Member *</Label>
                      <Select value={invoiceMemberId} onValueChange={setInvoiceMemberId}>
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
                    <div className="space-y-2">
                      <Label>Amount (AOA) *</Label>
                      <Input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        value={invoiceDueDate}
                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={invoiceDescription}
                        onChange={(e) => setInvoiceDescription(e.target.value)}
                        placeholder="Monthly membership"
                      />
                    </div>
                    <Button type="submit" className="w-full">Create Invoice</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">Member *</Label>
                      <Select value={memberId} onValueChange={setMemberId}>
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

                    {plans.length > 0 && (
                      <div className="space-y-2">
                        <Label>Membership Plan (optional)</Label>
                        <Select value={selectedPlanId} onValueChange={handlePlanSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan or enter custom amount" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - {formatCurrency(plan.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (AOA) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method">Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {multicaixaEnabled && (
                            <SelectItem value="multicaixa">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                Multicaixa Express
                              </div>
                            </SelectItem>
                          )}
                          {cashEnabled && (
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                Cash
                              </div>
                            </SelectItem>
                          )}
                          {bankTransferEnabled && (
                            <SelectItem value="bank_transfer">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Bank Transfer
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'multicaixa' && (
                      <div className="space-y-2">
                        <Label htmlFor="multicaixaRef">Multicaixa Reference</Label>
                        <Input
                          id="multicaixaRef"
                          placeholder="Transaction reference"
                          value={multicaixaRef}
                          onChange={(e) => setMulticaixaRef(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Monthly membership, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Record Payment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </RequirePermission>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{thisMonthPayments.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ArrowUpRight className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'sent').length}</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Receipt className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="methods">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            {/* Search & Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.member_name}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.description || '-'}</TableCell>
                          <TableCell className="font-semibold text-green-600">+{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              {getMethodIcon(payment.payment_method)}
                              <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(payment.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {loading ? 'Loading...' : 'No transactions found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.member_name}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Send
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <RequirePermission minimumRole="admin">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Smartphone className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Multicaixa Express</CardTitle>
                          <CardDescription>Mobile payment service</CardDescription>
                        </div>
                      </div>
                      <Switch checked={multicaixaEnabled} onCheckedChange={setMulticaixaEnabled} />
                    </div>
                  </CardHeader>
                  {multicaixaEnabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Entity Number</Label>
                        <Input
                          placeholder="e.g., 90099"
                          value={multicaixaEntity}
                          onChange={(e) => setMulticaixaEntity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reference Prefix</Label>
                        <Input
                          placeholder="e.g., 123456"
                          value={multicaixaReference}
                          onChange={(e) => setMulticaixaReference(e.target.value)}
                        />
                      </div>
                      <Button size="sm">Save Configuration</Button>
                    </CardContent>
                  )}
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Banknote className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Cash</CardTitle>
                          <CardDescription>In-person cash payments</CardDescription>
                        </div>
                      </div>
                      <Switch checked={cashEnabled} onCheckedChange={setCashEnabled} />
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Bank Transfer</CardTitle>
                          <CardDescription>Direct bank transfers</CardDescription>
                        </div>
                      </div>
                      <Switch checked={bankTransferEnabled} onCheckedChange={setBankTransferEnabled} />
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </RequirePermission>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}