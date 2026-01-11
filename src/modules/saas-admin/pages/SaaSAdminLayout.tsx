import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Megaphone,
  TicketCheck,
  Flag,
  Settings2,
  Activity,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/saas-admin' },
  { icon: Building2, label: 'Gym Management', href: '/saas-admin/gyms' },
  { icon: CreditCard, label: 'Subscriptions', href: '/saas-admin/subscriptions' },
  { icon: Megaphone, label: 'Announcements', href: '/saas-admin/announcements' },
  { icon: TicketCheck, label: 'Support Tickets', href: '/saas-admin/support' },
  { icon: Flag, label: 'Feature Flags', href: '/saas-admin/features' },
  { icon: Activity, label: 'System Health', href: '/saas-admin/health' },
  { icon: Settings2, label: 'Platform Settings', href: '/saas-admin/settings' },
];

export default function SaaSAdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-lg" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Crown className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Platform Admin
              </h1>
              <p className="text-xs text-muted-foreground">SaaS Management Console</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600">Super Admin</span>
            </div>
            <ThemeToggle />
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Exit to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'sticky top-16 h-[calc(100vh-4rem)] border-r border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1 py-4">
              <nav className="space-y-1 px-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.href} to={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 transition-all',
                          collapsed && 'justify-center px-2',
                          isActive &&
                            'bg-gradient-to-r from-amber-500/10 to-orange-600/10 text-amber-600 border border-amber-500/20'
                        )}
                      >
                        <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-amber-500')} />
                        {!collapsed && <span>{item.label}</span>}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="border-t border-border/50 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
