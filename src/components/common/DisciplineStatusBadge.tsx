import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface DisciplineStatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'default';
}

export function DisciplineStatusBadge({ isActive, size = 'default' }: DisciplineStatusBadgeProps) {
  if (isActive) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 bg-destructive/10 text-destructive border-destructive/20 ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}`}
    >
      <AlertTriangle className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      Disciplina Inativa
    </Badge>
  );
}
