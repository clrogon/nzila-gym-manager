import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import ContentSecurityPolicy from '@/security/ContentSecurityPolicy';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { GymProvider } from './contexts/GymContext';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Generate a nonce for CSP (in production, this should come from server)
const generateNonce = () => {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
};

const App: React.FC = () => {
  const [nonce, setNonce] = React.useState<string>('');

  useEffect(() => {
    // Generate nonce on mount
    setNonce(generateNonce());
    
    // Security: Disable debug information in production
    if (process.env.NODE_ENV === 'production') {
      // Disable React DevTools in production
      if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
        for (const [key, value] of Object.entries(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)) {
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__[key] = typeof value === 'function' ? () => {} : null;
        }
      }
      
      // Prevent console log attacks
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          originalConsoleLog.apply(console, args);
        }
      };
      
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Still log errors but sanitize them
        const sanitizedArgs = args.map(arg => {
          if (typeof arg === 'string' && arg.includes('password') || arg.includes('token')) {
            return '[REDACTED]';
          }
          return arg;
        });
        originalConsoleError.apply(console, sanitizedArgs);
      };
    }
  }, []);

  return (
    <HelmetProvider>
      <ContentSecurityPolicy nonce={nonce} />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <GymProvider>
              <Router>
                <AppRoutes />
                <Toaster />
              </Router>
            </GymProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
