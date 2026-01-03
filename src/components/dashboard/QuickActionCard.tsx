import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  variant?: 'primary' | 'success' | 'accent' | 'warning';
}

const variantStyles = {
  primary: {
    bg: 'bg-primary/10 hover:bg-primary/15',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    border: 'border-primary/20 hover:border-primary/40',
  },
  success: {
    bg: 'bg-success/10 hover:bg-success/15',
    iconBg: 'bg-success/20',
    iconColor: 'text-success',
    border: 'border-success/20 hover:border-success/40',
  },
  accent: {
    bg: 'bg-accent hover:bg-accent/80',
    iconBg: 'bg-foreground/10',
    iconColor: 'text-foreground',
    border: 'border-border hover:border-foreground/30',
  },
  warning: {
    bg: 'bg-warning/10 hover:bg-warning/15',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    border: 'border-warning/20 hover:border-warning/40',
  },
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = 'primary',
}: QuickActionCardProps) {
  const styles = variantStyles[variant];

  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center gap-4 rounded-xl border p-4 transition-all",
        styles.bg,
        styles.border
      )}
    >
      <div className={cn(
        "flex h-11 w-11 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
        styles.iconBg
      )}>
        <Icon className={cn("h-5 w-5", styles.iconColor)} />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
