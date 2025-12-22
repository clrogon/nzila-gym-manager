// src/contexts/SecureAuthContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  sessionExpiresIn: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiter for auth attempts
class AuthRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number; lockedUntil?: number }> = new Map();
  
  canAttempt(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    // Check if locked out
    if (record?.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) };
    }
    
    // Reset if window expired
    if (!record || now > record.resetAt) {
      this.attempts.set(identifier, { count: 1, resetAt: now + 60000 });
      return { allowed: true };
    }
    
    // Check attempt count
    if (record.count >= 5) {
      // Lock for 15 minutes after 5 failed attempts
      record.lockedUntil = now + 900000;
      return { allowed: false, retryAfter: 900 };
    }
    
    record.count++;
    return { allowed: true };
  }
  
  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  recordFailure(identifier: string): void {
    // Failure is already recorded in canAttempt
  }
}

const authRateLimiter = new AuthRateLimiter();

// Helper to log audit events safely
const logAuditEvent = async (action: string, entityType: string, newValues?: object) => {
  try {
    await supabase.from('audit_logs').insert([{
      action,
      entity_type: entityType,
      new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
    }]);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresIn, setSessionExpiresIn] = useState<number | null>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
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
        
        // Log successful refresh
        await logAuditEvent('SESSION_REFRESHED', 'auth');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [calculateSessionExpiry]);

  // Session timeout warning
  const checkSessionExpiry = useCallback(async () => {
    if (!session) return;
    
    const timeLeft = calculateSessionExpiry(session);
    if (!timeLeft) return;
    
    setSessionExpiresIn(timeLeft);
    
    // Show warning 5 minutes before expiry
    if (timeLeft < 300000 && timeLeft > 0 && !warningShown.current) {
      warningShown.current = true;
      
      // Show toast or modal warning
      const shouldExtend = window.confirm(
        'Your session will expire in 5 minutes. Would you like to extend it?'
      );
      
      if (shouldExtend) {
        await refreshSession();
      }
    }
    
    // Auto-logout if expired
    if (timeLeft <= 0) {
      await signOut();
      window.location.href = '/auth?reason=session_expired';
    }
  }, [session, calculateSessionExpiry, refreshSession]);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setSessionExpiresIn(calculateSessionExpiry(initialSession));
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth event:', event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setSessionExpiresIn(calculateSessionExpiry(currentSession));

        // Log auth events
        await logAuditEvent(`AUTH_${event.toUpperCase()}`, 'auth');

        if (event === 'TOKEN_REFRESHED') {
          warningShown.current = false;
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setSessionExpiresIn(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [calculateSessionExpiry]);

  // Start session expiry checker
  useEffect(() => {
    if (session) {
      sessionCheckInterval.current = setInterval(checkSessionExpiry, 60000);
      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
        }
      };
    }
  }, [session, checkSessionExpiry]);

  // Secure sign in with rate limiting
  const signIn = async (email: string, password: string) => {
    // Rate limiting
    const rateLimitCheck = authRateLimiter.canAttempt(email);
    if (!rateLimitCheck.allowed) {
      return {
        error: {
          message: `Too many login attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
          status: 429,
        } as AuthError,
      };
    }

    // Audit log - attempt
    await logAuditEvent('SIGN_IN_ATTEMPT', 'auth', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      authRateLimiter.recordFailure(email);
      
      // Audit log - failure
      await logAuditEvent('SIGN_IN_FAILED', 'auth', { email, error: error.message });
      
      return { error };
    }

    authRateLimiter.recordSuccess(email);
    
    // Audit log - success
    await logAuditEvent('SIGN_IN_SUCCESS', 'auth', { email });

    return { error: null };
  };

  // Secure sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    // Basic validation
    if (password.length < 8) {
      return {
        error: {
          message: 'Password must be at least 8 characters',
          status: 400,
        } as AuthError,
      };
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return {
        error: {
          message: 'Password must contain uppercase, lowercase, and numbers',
          status: 400,
        } as AuthError,
      };
    }

    // Audit log - attempt
    await logAuditEvent('SIGN_UP_ATTEMPT', 'auth', { email });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      // Audit log - failure
      await logAuditEvent('SIGN_UP_FAILED', 'auth', { email, error: error.message });
      
      return { error };
    }

    // Audit log - success
    await logAuditEvent('SIGN_UP_SUCCESS', 'auth', { email });

    return { error: null };
  };

  // Secure sign out
  const signOut = async () => {
    // Audit log
    await logAuditEvent('SIGN_OUT', 'auth');

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionExpiresIn(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    sessionExpiresIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSecureAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within SecureAuthProvider');
  }
  return context;
}

// Session timeout warning component
export function SessionTimeoutWarning() {
  const { sessionExpiresIn, refreshSession } = useSecureAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (sessionExpiresIn && sessionExpiresIn < 300000 && sessionExpiresIn > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [sessionExpiresIn]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-lg z-50">
      <p className="font-medium">Session expiring soon</p>
      <p className="text-sm">Your session will expire in {Math.ceil((sessionExpiresIn || 0) / 60000)} minutes</p>
      <button
        onClick={() => refreshSession()}
        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
      >
        Extend Session
      </button>
    </div>
  );
}
