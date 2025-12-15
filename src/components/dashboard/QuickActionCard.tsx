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
    bg: 'bg-primary/5 hover:bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-primary/10 hover:border-primary/30',
  },
  success: {
    bg: 'bg-success/5 hover:bg-success/10',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    border: 'border-success/10 hover:border-success/30',
  },
  accent: {
    bg: 'bg-accent hover:bg-accent/80',
    iconBg: 'bg-accent-foreground/10',
    iconColor: 'text-accent-foreground',
    border: 'border-accent-foreground/10 hover:border-accent-foreground/30',
  },
  warning: {
    bg: 'bg-warning/5 hover:bg-warning/10',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    border: 'border-warning/10 hover:border-warning/30',
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
