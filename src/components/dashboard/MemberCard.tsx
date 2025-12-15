import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  membershipPlan?: string;
  lastCheckIn?: string;
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border-success/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
};

export function MemberCard({
  name,
  email,
  avatarUrl,
  status,
  membershipPlan,
  lastCheckIn,
  onClick,
  className,
}: MemberCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusStyle = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
    >
      <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground truncate">{name}</h4>
          <Badge 
            variant="outline" 
            className={cn("text-xs shrink-0", statusStyle.className)}
          >
            {statusStyle.label}
          </Badge>
        </div>
        {email && (
          <p className="text-sm text-muted-foreground truncate">{email}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {membershipPlan && (
            <span className="text-xs text-primary font-medium">{membershipPlan}</span>
          )}
          {lastCheckIn && (
            <span className="text-xs text-muted-foreground">
              Last check-in: {lastCheckIn}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
