import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Upload, FileText, CheckCircle2, XCircle, Link2, 
  AlertTriangle, Download, Loader2, RefreshCw 
} from 'lucide-react';
import { format } from 'date-fns';
import { parseBankFile, matchTransactionsToPayments, BankTransaction, PaymentMatch } from '@/lib/fileParser';

export function BankReconciliation() {
  const { currentGym } = useGym();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [matches, setMatches] = useState<PaymentMatch[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [manualMatches, setManualMatches] = useState<Record<number, string>>({});

  // Fetch pending payments for matching
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['pending-payments', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, description, reference, member_id')
        .eq('gym_id', currentGym.id)
        .in('payment_status', ['pending'])
        .order('created_at', { ascending: false });

      if (!payments) return [];

      // Get member names
      const memberIds = [...new Set(payments.map(p => p.member_id))];
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name')
        .in('id', memberIds);

      const memberMap = new Map(members?.map(m => [m.id, m.full_name]));

      return payments.map(p => ({
        id: p.id,
        amount: p.amount,
        description: p.description,
        reference: p.reference,
        member_name: memberMap.get(p.member_id) || 'Unknown',
      }));
    },
    enabled: !!currentGym?.id,
  });

  // Fetch reconciliation history
  const { data: reconciliations = [] } = useQuery({
    queryKey: ['reconciliations', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      
      const { data } = await supabase
        .from('bank_reconciliations')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('imported_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!currentGym?.id,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseBankFile(text, file.name);
      
      setTransactions(result.transactions);
      setParseErrors(result.errors);
      
      // Auto-match transactions
      const matchResults = matchTransactionsToPayments(result.transactions, pendingPayments);
      setMatches(matchResults);
      
      toast.success(`Parsed ${result.transactions.length} transactions`, {
        description: `Delimiter: ${result.detectedDelimiter}, Errors: ${result.errors.length}`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse bank file');
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = (transactionIndex: number, paymentId: string) => {
    setManualMatches(prev => ({
      ...prev,
      [transactionIndex]: paymentId,
    }));
    
    // Update matches array
    setMatches(prev => prev.map((m, i) => {
      if (i === transactionIndex) {
        const payment = pendingPayments.find(p => p.id === paymentId);
        return {
          ...m,
          paymentId,
          paymentAmount: payment?.amount || null,
          matchConfidence: 'high' as const,
          reason: 'Manual match',
        };
      }
      return m;
    }));
  };

  const processReconciliation = useMutation({
    mutationFn: async () => {
      if (!currentGym?.id) return;

      const matchedCount = matches.filter(m => m.paymentId).length;
      const unmatchedCount = matches.filter(m => !m.paymentId).length;

      // Create reconciliation record
      const { data: recon, error: reconError } = await supabase
        .from('bank_reconciliations')
        .insert({
          gym_id: currentGym.id,
          file_name: 'bank_statement.csv',
          total_transactions: transactions.length,
          matched_transactions: matchedCount,
          unmatched_transactions: unmatchedCount,
          status: 'completed',
        })
        .select()
        .single();

      if (reconError) throw reconError;

      // Update matched payments to completed
      for (const match of matches) {
        if (match.paymentId) {
          await supabase
            .from('payments')
            .update({
              payment_status: 'completed',
              paid_at: match.transaction.date.toISOString(),
            })
            .eq('id', match.paymentId);

          // Create reconciliation item
          await supabase
            .from('bank_reconciliation_items')
            .insert({
              reconciliation_id: recon.id,
              transaction_date: match.transaction.date.toISOString().split('T')[0],
              description: match.transaction.description,
              amount: match.transaction.amount,
              reference: match.transaction.reference,
              matched_payment_id: match.paymentId,
              status: 'matched',
            });
        }
      }

      return recon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      toast.success('Reconciliation completed', {
        description: `${matches.filter(m => m.paymentId).length} payments marked as completed.`,
      });
      
      // Reset state
      setTransactions([]);
      setMatches([]);
      setParseErrors([]);
      setManualMatches({});
    },
    onError: () => {
      toast.error('Reconciliation failed');
    },
  });

  const matchedCount = matches.filter(m => m.paymentId).length;
  const unmatchedCount = matches.filter(m => !m.paymentId).length;
  const matchPercentage = matches.length > 0 ? (matchedCount / matches.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bank Statement Import
          </CardTitle>
          <CardDescription>
            Import bank statement files (CSV/TXT) to automatically match and reconcile payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="bank-file-upload"
              />
              <label
                htmlFor="bank-file-upload"
                className="flex flex-col items-center gap-3 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Upload Bank Statement</p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV and TXT files exported from your bank
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <>
              {/* Match Summary */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Match Rate</span>
                    <span>{matchPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={matchPercentage} />
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {matchedCount} matched
                  </div>
                  <div className="flex items-center gap-1 text-orange-500">
                    <AlertTriangle className="w-4 h-4" />
                    {unmatchedCount} unmatched
                  </div>
                </div>
              </div>

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    {parseErrors.length} rows had parsing issues
                  </AlertDescription>
                </Alert>
              )}

              {/* Transactions Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(match.transaction.date, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {match.transaction.description}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {match.transaction.amount.toLocaleString()} AOA
                        </TableCell>
                        <TableCell>
                          {match.paymentId ? (
                            <Badge 
                              variant={match.matchConfidence === 'high' ? 'default' : 'secondary'}
                              className="gap-1"
                            >
                              <Link2 className="w-3 h-3" />
                              {match.matchConfidence}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unmatched</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!match.paymentId || match.matchConfidence !== 'high' ? (
                            <Select
                              value={manualMatches[index] || match.paymentId || ''}
                              onValueChange={(value) => handleManualMatch(index, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select payment" />
                              </SelectTrigger>
                              <SelectContent>
                                {pendingPayments.map((payment) => (
                                  <SelectItem key={payment.id} value={payment.id}>
                                    {payment.member_name} - {payment.amount.toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Auto-matched
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransactions([]);
                    setMatches([]);
                    setParseErrors([]);
                    setManualMatches({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => processReconciliation.mutate()}
                  disabled={processReconciliation.isPending || matchedCount === 0}
                >
                  {processReconciliation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Process {matchedCount} Matched Payments
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reconciliations</CardTitle>
        </CardHeader>
        <CardContent>
          {reconciliations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No reconciliations yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Matched</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((recon) => (
                  <TableRow key={recon.id}>
                    <TableCell>
                      {format(new Date(recon.imported_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {recon.file_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {recon.total_transactions}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600">{recon.matched_transactions}</span>
                      {' / '}
                      <span className="text-orange-500">{recon.unmatched_transactions}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={recon.status === 'completed' ? 'default' : 'secondary'}>
                        {recon.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
