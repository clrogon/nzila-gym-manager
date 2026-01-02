import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Import components
import Login from './pages/Login';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Kiosk from './pages/Kiosk';
import GDPRCompliance from './components/GDPRCompliance';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="payments" element={<Payments />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/gdpr" element={<GDPRCompliance />} />
                <Route path="kiosk" element={<Kiosk />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
