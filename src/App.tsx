// src/App.tsx – MERGED, COMPLETE, SAFE

import { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GymProvider, useGym } from "@/contexts/GymContext";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ModuleLoader } from "@/components/common/ModuleLoader";

// Public & Static Pages
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import UserProfile from "@/pages/UserProfile";

// Error Pages
import NotFound from "@/pages/errors/NotFound";
import ServerError from "@/pages/errors/ServerError";
import Forbidden from "@/pages/errors/Forbidden";
import Offline from "@/pages/errors/Offline";

// Modular Pages
import { AuthPage } from "./modules/auth";
import { DashboardPage } from "./modules/dashboard";
import {
  MembersManagementPage,
  MemberPortalPage,
  MemberCheckInPage,
  MemberFinancesPage,
  MemberActivityPage,
} from "./modules/members";
import { CheckInsPage } from "./modules/checkins";
import { PaymentsPage } from "./modules/payments";
import { SettingsPage } from "./modules/settings";
import { OnboardingPage } from "./modules/onboarding";
import { SuperAdminPage } from "./modules/superadmin";
import { SaaSAdminGuard } from "./components/auth/SaaSAdminGuard";
import { SaaSAdminDashboard, GymManagement } from "./modules/saas-admin";
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

/* -----------------------------
   Route Guards
------------------------------*/

function ProtectedRoute({
  children,
  moduleName,
}: {
  children: React.ReactNode;
  moduleName: string;
}) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <ModuleLoader message="Loading..." />;
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

/* -----------------------------
   Routes
------------------------------*/

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Auth & Onboarding */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <ErrorBoundary moduleName="Auth">
              <AuthPage />
            </ErrorBoundary>
          </PublicRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />

      {/* Core App */}
      <Route path="/dashboard" element={<ProtectedRoute moduleName="Dashboard"><DashboardPage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute moduleName="Members"><MembersManagementPage /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute moduleName="Staff"><StaffPage /></ProtectedRoute>} />

      {/* Member */}
      <Route path="/member/portal" element={<ProtectedRoute moduleName="Member Portal"><MemberPortalPage /></ProtectedRoute>} />
      <Route path="/member/checkin" element={<ProtectedRoute moduleName="Member Check-In"><MemberCheckInPage /></ProtectedRoute>} />
      <Route path="/member/finances" element={<ProtectedRoute moduleName="Member Finances"><MemberFinancesPage /></ProtectedRoute>} />
      <Route path="/member/activity" element={<ProtectedRoute moduleName="Member Activity"><MemberActivityPage /></ProtectedRoute>} />

      {/* Operations */}
      <Route path="/check-ins" element={<ProtectedRoute moduleName="Check-ins"><CheckInsPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute moduleName="Calendar"><CalendarPage /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute moduleName="Training"><TrainingPage /></ProtectedRoute>} />
      <Route path="/disciplines" element={<ProtectedRoute moduleName="Disciplines"><DisciplinesPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute moduleName="Payments"><PaymentsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute moduleName="Invoices"><InvoicesPage /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute moduleName="Leads"><LeadsPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute moduleName="Inventory"><InventoryPage /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute moduleName="POS"><POSPage /></ProtectedRoute>} />

      {/* Special */}
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/settings" element={<ProtectedRoute moduleName="Settings"><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute moduleName="Profile"><UserProfile /></ProtectedRoute>} />
      <Route path="/super-admin" element={<ProtectedRoute moduleName="Super Admin"><SuperAdminPage /></ProtectedRoute>} />
      
      {/* SaaS Admin Portal */}
      <Route element={<SaaSAdminGuard />}>
        <Route path="/saas-admin" element={<SaaSAdminDashboard />} />
        <Route path="/saas-admin/gyms" element={<GymManagement />} />
      </Route>

      {/* Error Pages */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/offline" element={<Offline />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* -----------------------------
   App Root
------------------------------*/

const App = () => {
  // Offline detection (from previous version)
  useEffect(() => {
    const handleOffline = () => {
      if (window.location.pathname !== "/offline") {
        window.location.href = "/offline";
      }
    };

    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  return (
    <ErrorBoundary moduleName="App">
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
    </ErrorBoundary>
  );
};

export default App;
