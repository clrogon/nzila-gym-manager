import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MembershipStatusCardProps {
  planName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  onRenew?: () => void;
}

export default function MembershipStatusCard({
  planName,
  status,
  startDate,
  endDate,
  onRenew,
}: MembershipStatusCardProps) {
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  const daysRemaining = end ? differenceInDays(end, now) : null;

  const getStatusInfo = () => {
    if (status !== 'active') {
      return { label: 'Inativo', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (daysRemaining !== null) {
      if (daysRemaining < 0) {
        return { label: 'Expirado', variant: 'destructive' as const, icon: AlertTriangle };
      }
      if (daysRemaining <= 7) {
        return { label: 'A Expirar', variant: 'secondary' as const, icon: AlertTriangle };
      }
    }
    return { label: 'Ativo', variant: 'default' as const, icon: CheckCircle };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-primary" />
          Estado da Subscrição
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plano Atual</p>
            <p className="text-xl font-semibold">{planName || 'Sem plano'}</p>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </Badge>
        </div>

        {startDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Início: {format(new Date(startDate), 'dd MMM yyyy', { locale: pt })}
            </span>
          </div>
        )}

        {endDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expira em</span>
              <span className={daysRemaining !== null && daysRemaining <= 7 ? 'text-destructive font-medium' : ''}>
                {format(new Date(endDate), 'dd MMM yyyy', { locale: pt })}
              </span>
            </div>
            {daysRemaining !== null && daysRemaining > 0 && (
              <p className="text-sm text-muted-foreground">
                {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
              </p>
            )}
          </div>
        )}

        {onRenew && daysRemaining !== null && daysRemaining <= 7 && (
          <Button onClick={onRenew} className="w-full">
            Renovar Agora
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
