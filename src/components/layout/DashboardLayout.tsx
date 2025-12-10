import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { useRBAC, AppRole } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Dumbbell,
  ChevronDown,
  ShieldCheck,
  Building2,
  UserCog,
  CalendarDays,
  Target,
  TrendingUp,
  Package,
  ShoppingCart,
  FileText,
  Scan,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  requiredRoles?: AppRole[];
  permission?: string;
};

// Gym-level navigation with role requirements
const gymNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Members', href: '/members', permission: 'members:read' },
  { icon: TrendingUp, label: 'Leads', href: '/leads', permission: 'members:read' },
  { icon: UserCheck, label: 'Check-ins', href: '/check-ins', permission: 'checkins:read' },
  { icon: CalendarDays, label: 'Calendar', href: '/calendar', permission: 'classes:read' },
  { icon: Target, label: 'Training', href: '/training', permission: 'training:read' },
  { icon: CreditCard, label: 'Finance', href: '/payments', permission: 'payments:read' },
  { icon: FileText, label: 'Invoices', href: '/invoices', permission: 'payments:read' },
  { icon: Package, label: 'Inventory', href: '/inventory', requiredRoles: ['super_admin', 'gym_owner', 'admin'] },
  { icon: ShoppingCart, label: 'POS', href: '/pos', permission: 'payments:read' },
  { icon: Scan, label: 'Kiosk', href: '/kiosk', requiredRoles: ['super_admin', 'gym_owner', 'admin', 'staff'] },
  { icon: UserCog, label: 'Staff', href: '/staff', requiredRoles: ['super_admin', 'gym_owner', 'admin'] },
  { icon: Settings, label: 'Settings', href: '/settings', requiredRoles: ['super_admin', 'gym_owner', 'admin'] },
];

// Platform-level navigation (Super Admin only)
const platformNavItems: NavItem[] = [
  { icon: Building2, label: 'Gyms', href: '/super-admin' },
  { icon: UserCog, label: 'All Staff', href: '/staff' },
];

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  gym_owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
  member: 'Member',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { currentGym, gyms, setCurrentGym } = useGym();
  const { isSuperAdmin, currentRole, hasPermission, hasRole } = useRBAC();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'platform' | 'gym'>(() => 
    location.pathname === '/super-admin' ? 'platform' : 'gym'
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Filter nav items based on permissions
  const baseNavItems = viewMode === 'platform' ? platformNavItems : gymNavItems;
  const navItems = baseNavItems.filter(item => {
    if (item.requiredRoles) {
      return hasRole(item.requiredRoles);
    }
    if (item.permission) {
      return hasPermission(item.permission);
    }
    return true;
  });

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:transform-none gradient-sidebar',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display text-sidebar-foreground leading-tight truncate max-w-[140px]">
                  {currentGym?.name || 'Nzila'}
                </span>
                {currentGym && (
                  <span className="text-[10px] text-muted-foreground">
                    powered by <span className="font-medium text-primary">Nzila</span>
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Gym Selector */}
          {gyms.length > 0 && (
            <div className="p-4 border-b border-sidebar-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent">
                    <span className="truncate">{currentGym?.name || 'Select Gym'}</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Your Gyms</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {gyms.map((gym) => (
                    <DropdownMenuItem
                      key={gym.id}
                      onClick={() => setCurrentGym(gym)}
                      className={cn(currentGym?.id === gym.id && 'bg-accent')}
                    >
                      {gym.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* View Mode Toggle (Super Admin only) */}
          {isSuperAdmin && (
            <div className="px-4 py-3 border-b border-sidebar-border">
              <div className="flex flex-col gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <Label htmlFor="view-mode" className="text-xs font-medium text-sidebar-foreground cursor-pointer">
                      Platform Mode
                    </Label>
                  </div>
                  <Switch
                    id="view-mode"
                    checked={viewMode === 'platform'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'platform' : 'gym')}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {viewMode === 'platform' 
                    ? 'Managing all gyms & platform staff' 
                    : 'Managing selected gym only'}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    {currentRole && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                        {ROLE_LABELS[currentRole]}
                      </Badge>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}