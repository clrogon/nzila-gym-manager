import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, Calendar, TrendingUp, Users, Wallet, 
  FileText, Filter, BarChart3, Loader2 
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { generateReportPDF, downloadPDF } from '@/lib/pdfService';

export function FinancialReporting() {
  const { currentGym } = useGym();
  const [dateStart, setDateStart] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-report', currentGym?.id, dateStart, dateEnd],
    queryFn: async () => {
      if (!currentGym?.id) return null;

      // Fetch payments in date range
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, payment_method, payment_status, description, created_at, member_id')
        .eq('gym_id', currentGym.id)
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd + 'T23:59:59')
        .order('created_at', { ascending: false });

      // Get member names
      const memberIds = [...new Set(payments?.map(p => p.member_id) || [])];
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name')
        .in('id', memberIds);

      const memberMap = new Map(members?.map(m => [m.id, m.full_name]));

      // Calculate metrics
      const completedPayments = payments?.filter(p => p.payment_status === 'completed') || [];
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalTransactions = completedPayments.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Payment method breakdown
      const methodBreakdown = completedPayments.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount;
        return acc;
      }, {} as Record<string, number>);

      // Get new members count
      const { count: newMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', currentGym.id)
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd + 'T23:59:59');

      return {
        payments: payments?.map(p => ({
          ...p,
          member_name: memberMap.get(p.member_id) || 'Unknown',
        })) || [],
        metrics: {
          totalRevenue,
          totalTransactions,
          avgTransaction,
          newMembers: newMembers || 0,
          methodBreakdown,
        },
      };
    },
    enabled: !!currentGym?.id,
  });

  const handleExportPDF = async () => {
    if (!reportData || !currentGym) return;

    setExporting(true);
    try {
      const doc = generateReportPDF({
        title: 'Financial Report',
        dateRange: {
          start: format(new Date(dateStart), 'MMM d, yyyy'),
          end: format(new Date(dateEnd), 'MMM d, yyyy'),
        },
        gymName: currentGym.name,
        currency: currentGym.currency || 'AOA',
        metrics: [
          { label: 'Total Revenue', value: `${reportData.metrics.totalRevenue.toLocaleString()} AOA` },
          { label: 'Transactions', value: reportData.metrics.totalTransactions },
          { label: 'Avg. Transaction', value: `${reportData.metrics.avgTransaction.toLocaleString()} AOA` },
          { label: 'New Members', value: reportData.metrics.newMembers },
        ],
        transactions: reportData.payments.slice(0, 50).map(p => ({
          date: format(new Date(p.created_at), 'MMM d, yyyy'),
          description: p.description || p.member_name,
          amount: p.amount,
          status: p.payment_status,
        })),
      });

      downloadPDF(doc, `financial-report-${dateStart}-to-${dateEnd}.pdf`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' AOA';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Financial Report
          </CardTitle>
          <CardDescription>
            Analyze revenue, transactions, and financial trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="membership">Memberships</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExportPDF} disabled={exporting || isLoading}>
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.metrics.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{reportData.metrics.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.metrics.avgTransaction)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Members</p>
                  <p className="text-2xl font-bold">{reportData.metrics.newMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Method Breakdown */}
      {reportData && Object.keys(reportData.metrics.methodBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reportData.metrics.methodBreakdown).map(([method, amount]) => (
                <div key={method} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground capitalize">{method.replace('_', ' ')}</p>
                  <p className="text-xl font-bold">{formatCurrency(amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {((amount / reportData.metrics.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.payments.slice(0, 20).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{payment.member_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.description || '-'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}
                      >
                        {payment.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData || reportData.payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions in this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
