import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
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

export default function Payments() {
  const { currentGym } = useGym();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('multicaixa');
  const [multicaixaRef, setMulticaixaRef] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (currentGym) {
      fetchMembers();
      fetchPayments();
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

  const fetchPayments = async () => {
    if (!currentGym) return;

    try {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, member_id, amount, payment_method, payment_status, multicaixa_reference, description, created_at')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false })
        .limit(50);

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
      const { error } = await supabase.from('payments').insert([{
        gym_id: currentGym.id,
        member_id: memberId,
        amount: parseFloat(amount),
        payment_method: paymentMethod as 'multicaixa' | 'cash' | 'bank_transfer' | 'other',
        payment_status: 'completed' as const,
        multicaixa_reference: paymentMethod === 'multicaixa' ? multicaixaRef : null,
        description: description || null,
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

  const resetForm = () => {
    setMemberId('');
    setAmount('');
    setPaymentMethod('multicaixa');
    setMulticaixaRef('');
    setDescription('');
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
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Payments</h1>
            <p className="text-muted-foreground">Track member payments</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                      <SelectItem value="multicaixa">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Multicaixa Express
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Bank Transfer
                        </div>
                      </SelectItem>
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
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.member_name}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
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
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No payments recorded'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}