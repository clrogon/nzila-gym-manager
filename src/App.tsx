// src/App.tsx - COMPLETE FILE WITH ERROR PAGES

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GymProvider } from "@/contexts/GymContext";
import { ErrorBoundary } from "@/pages/errors/ErrorBoundary";

// Error Pages
import NotFound from "@/pages/errors/NotFound";
import ServerError from "@/pages/errors/ServerError";
import Forbidden from "@/pages/errors/Forbidden";
import Offline from "@/pages/errors/Offline";

// Auth & Landing
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Dashboard & Main Pages
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import CheckIns from "./pages/CheckIns";
import Payments from "./pages/Payments";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import Training from "./pages/Training";
import Disciplines from "./pages/Disciplines";
import Staff from "./pages/Staff";

// Member Pages
import MemberPortal from "./pages/member/MemberPortal";
import MemberCheckIn from "./pages/member/MemberCheckIn";
import MemberActivity from "./pages/member/MemberActivity";
import MemberFinances from "./pages/member/MemberFinances";

// Staff Pages
import MembersManagement from "./pages/staff/MembersManagement";

// Super Admin
import SuperAdmin from "./pages/SuperAdmin";

const queryClient = new QueryClient();

const App = () => {
  // Check for offline status
  useEffect(() => {
    const handleOnline = () => console.log("Back online");
    const handleOffline = () => {
      // Redirect to offline page if needed
      if (window.location.pathname !== '/offline') {
        window.location.href = '/offline';
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <GymProvider>
                <Routes>
                  {/* Landing & Auth */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />

                  {/* Dashboard & Main */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/check-ins" element={<CheckIns />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/disciplines" element={<Disciplines />} />
                  <Route path="/staff" element={<Staff />} />

                  {/* Member Portal */}
                  <Route path="/member" element={<MemberPortal />} />
                  <Route path="/member/checkin" element={<MemberCheckIn />} />
                  <Route path="/member/activity" element={<MemberActivity />} />
                  <Route path="/member/finances" element={<MemberFinances />} />

                  {/* Staff Management */}
                  <Route path="/members" element={<MembersManagement />} />

                  {/* Super Admin */}
                  <Route path="/super-admin" element={<SuperAdmin />} />

                  {/* Error Pages - Explicit Routes */}
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/offline" element={<Offline />} />

                  {/* 404 - Must be last */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </GymProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
