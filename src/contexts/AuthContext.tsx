import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResponse {
  allowed: boolean;
  reason?: string;
  blocked_until?: string;
  retry_after_seconds?: number;
  attempts_remaining?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  sessionExpiresIn: number | null;
}

// Log auth events
const logAuthEvent = async (
  eventType: string, 
  userId?: string | null,
  metadata?: Record<string, string | number | boolean | null>
) => {
  try {
    await supabase.from('auth_events').insert([{
      user_id: userId || null,
      event_type: eventType,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      user_agent: navigator.userAgent,
    }]);
  } catch {
    // Silently fail - don't block auth flow
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresIn, setSessionExpiresIn] = useState<number | null>(null);
  const sessionCheckInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warningShown = useRef(false);

  // Calculate session expiry
  const calculateSessionExpiry = useCallback((currentSession: Session | null) => {
    if (!currentSession?.expires_at) return null;
    const expiresAt = currentSession.expires_at * 1000;
    return expiresAt - Date.now();
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setSessionExpiresIn(calculateSessionExpiry(data.session));
        warningShown.current = false;
        
        await logAuthEvent('SESSION_REFRESHED', data.session.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [calculateSessionExpiry]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setSessionExpiresIn(calculateSessionExpiry(currentSession));
      setLoading(false);

      // Log auth events (deferred to avoid deadlock)
      if (currentSession?.user) {
        setTimeout(() => {
          logAuthEvent(`AUTH_${event.toUpperCase()}`, currentSession.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setSessionExpiresIn(calculateSessionExpiry(initialSession));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [calculateSessionExpiry]);

  // Session expiry checker
  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const timeLeft = calculateSessionExpiry(session);
      if (!timeLeft) return;
      
      setSessionExpiresIn(timeLeft);
      
      // Show warning 5 minutes before expiry
      if (timeLeft < 300000 && timeLeft > 0 && !warningShown.current) {
        warningShown.current = true;
        const shouldExtend = window.confirm(
          'Your session will expire in 5 minutes. Would you like to extend it?'
        );
        if (shouldExtend) {
          refreshSession();
        }
      }
    };

    sessionCheckInterval.current = setInterval(checkSessionExpiry, 60000);
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [session, calculateSessionExpiry, refreshSession]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Call edge function with server-side rate limiting
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-with-rate-limit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email, password, action: 'signin' }),
        }
      );

      const data = await response.json();

      if (response.status === 429) {
        // Rate limited
        const retryAfter = (data as RateLimitResponse).retry_after_seconds || 1800;
        return {
          error: new Error(`Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`),
        };
      }

      if (data.error) {
        await logAuthEvent('SIGN_IN_FAILED', null, { email, error: data.error.message || 'Unknown error' });
        return { error: new Error(data.error.message || 'Authentication failed') };
      }

      // Set session from the response
      if (data.data?.session) {
        await supabase.auth.setSession(data.data.session);
        await logAuthEvent('SIGN_IN_SUCCESS', data.data.user?.id, { email });
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { error: new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Password strength validation
    if (password.length < 8) {
      return { error: new Error('Password must be at least 8 characters') };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return { error: new Error('Password must contain uppercase, lowercase, and numbers') };
    }

    setLoading(true);
    try {
      // Call edge function with server-side rate limiting
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-with-rate-limit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            email, 
            password, 
            action: 'signup',
            fullName 
          }),
        }
      );

      const data = await response.json();

      if (response.status === 429) {
        const retryAfter = (data as RateLimitResponse).retry_after_seconds || 1800;
        return {
          error: new Error(`Too many signup attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`),
        };
      }

      if (data.error) {
        await logAuthEvent('SIGN_UP_FAILED', null, { email, error: data.error.message || 'Unknown error' });
        return { error: new Error(data.error.message || 'Registration failed') };
      }

      await logAuthEvent('SIGN_UP_SUCCESS', data.data?.user?.id, { email });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { error: new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    const currentUserId = user?.id;
    await logAuthEvent('SIGN_OUT', currentUserId);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signInWithMagicLink, 
      signInWithGoogle, 
      signOut,
      refreshSession,
      sessionExpiresIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
