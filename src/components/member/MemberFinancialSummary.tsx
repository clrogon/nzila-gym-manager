import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Receipt, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MemberFinancialSummaryProps {
  outstandingBalance: number;
  currency: string;
  lastPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
}

export default function MemberFinancialSummary({
  outstandingBalance,
  currency,
  lastPaymentDate,
  lastPaymentAmount,
}: MemberFinancialSummaryProps) {
  const navigate = useNavigate();

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

        {lastPaymentDate && lastPaymentAmount !== null && (
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
