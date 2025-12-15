import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RecentCheckInItemProps {
  memberName: string;
  avatarUrl?: string;
  time: string;
  className?: string;
}

export function RecentCheckInItem({
  memberName,
  avatarUrl,
  time,
  className,
}: RecentCheckInItemProps) {
  const initials = memberName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted",
      className
    )}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={avatarUrl} alt={memberName} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{memberName}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}
