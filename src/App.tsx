import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GymProvider, useGym } from "@/contexts/GymContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ModuleLoader } from "@/components/common/ModuleLoader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserProfile from '@/pages/UserProfile';
import Dependents from '@/pages/Dependents';


// Modular imports with lazy loading
import { AuthPage } from "./modules/auth";
import { DashboardPage } from "./modules/dashboard";
import { MembersPage } from "./modules/members";
import { CheckInsPage } from "./modules/checkins";
import { PaymentsPage } from "./modules/payments";
import { SettingsPage } from "./modules/settings";
import { OnboardingPage } from "./modules/onboarding";
import { SuperAdminPage } from "./modules/superadmin";
import { StaffPage } from "./modules/staff";
import { CalendarPage } from "./modules/calendar";
import { TrainingPage } from "./modules/training";
import { LeadsPage } from "./modules/leads";
import { InventoryPage } from "./modules/inventory";
import { POSPage } from "./modules/pos";
import { KioskPage } from "./modules/kiosk";
import { InvoicesPage } from "./modules/invoices";
import { DisciplinesPage } from "./modules/disciplines";

const queryClient = new QueryClient();

function ProtectedRoute({ children, moduleName }: { children: React.ReactNode; moduleName: string }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <ModuleLoader message="Loading..." />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <ErrorBoundary moduleName={moduleName}>
      <Suspense fallback={<ModuleLoader message={`Loading ${moduleName}...`} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { gyms, loading: gymLoading } = useGym();
  
  if (authLoading || gymLoading) return <ModuleLoader />;
  
  if (user) {
    // Redirect to onboarding if no gyms, otherwise to dashboard
    if (gyms.length === 0) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { gyms, loading: gymLoading } = useGym();

  if (authLoading || gymLoading) return <ModuleLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (gyms.length > 0) return <Navigate to="/dashboard" replace />;

  return (
    <ErrorBoundary moduleName="Onboarding">
      <Suspense fallback={<ModuleLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<PublicRoute><ErrorBoundary moduleName="Auth"><AuthPage /></ErrorBoundary></PublicRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute moduleName="Dashboard"><DashboardPage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute moduleName="Members"><MembersPage /></ProtectedRoute>} />
      <Route path="/check-ins" element={<ProtectedRoute moduleName="Check-ins"><CheckInsPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute moduleName="Calendar"><CalendarPage /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute moduleName="Training"><TrainingPage /></ProtectedRoute>} />
      <Route path="/disciplines" element={<ProtectedRoute moduleName="Disciplines"><DisciplinesPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute moduleName="Payments"><PaymentsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute moduleName="Invoices"><InvoicesPage /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute moduleName="Leads"><LeadsPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute moduleName="Inventory"><InventoryPage /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute moduleName="POS"><POSPage /></ProtectedRoute>} />
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/settings" element={<ProtectedRoute moduleName="Settings"><SettingsPage /></ProtectedRoute>} />
      <Route path="/super-admin" element={<ProtectedRoute moduleName="Super Admin"><SuperAdminPage /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute moduleName="Staff"><StaffPage /></ProtectedRoute>} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/dependents" element={<Dependents />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GymProvider>
            <AppRoutes />
          </GymProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
