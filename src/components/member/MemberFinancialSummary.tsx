import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Receipt, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemberFinancialSummary } from '@/hooks/useFinancialData.tanstack';

interface MemberFinancialSummaryProps {
  memberId?: string;
  gymId?: string;
  currency?: string;
  // Legacy props for backward compatibility
  outstandingBalance?: number;
  lastPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
}

export default function MemberFinancialSummary({
  memberId,
  gymId,
  currency = 'AOA',
  outstandingBalance: legacyBalance,
  lastPaymentDate: legacyPaymentDate,
  lastPaymentAmount: legacyPaymentAmount,
}: MemberFinancialSummaryProps) {
  const navigate = useNavigate();
  
  // Use hook if memberId and gymId provided, otherwise use legacy props
  const { data: financialData, isLoading } = useMemberFinancialSummary(memberId, gymId);

  // Determine data source
  const outstandingBalance = financialData?.outstandingBalance ?? legacyBalance ?? 0;
  const lastPaymentDate = financialData?.lastPaymentDate ?? legacyPaymentDate;
  const lastPaymentAmount = financialData?.lastPaymentAmount ?? legacyPaymentAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading && memberId && gymId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="w-5 h-5 text-primary" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Saldo Pendente</p>
            <p className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(outstandingBalance)}
            </p>
          </div>
        </div>

        {lastPaymentDate && lastPaymentAmount !== null && lastPaymentAmount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
            <Receipt className="w-4 h-4" />
            <span>
              Último pagamento: {formatCurrency(lastPaymentAmount)} em {formatDate(lastPaymentDate)}
            </span>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/member/finances')}
        >
          Ver Histórico Completo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
