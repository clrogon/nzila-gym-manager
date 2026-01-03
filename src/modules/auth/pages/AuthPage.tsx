import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export default function AuthPage() {
  const { user, signIn, signUp, signInWithMagicLink, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const newMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
    setMode(newMode);
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.issues[0].message, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!fullName.trim()) throw new Error('Full name is required');
    } catch (err) {
      const message = err instanceof z.ZodError ? err.issues[0].message : (err as Error).message;
      toast({ title: 'Validation Error', description: message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({ title: 'Account Exists', description: 'This email is already registered. Try signing in.', variant: 'destructive' });
      } else {
        toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Account Created', description: 'Welcome to Nzila!' });
    }
  };

  const handleMagicLink = async () => {
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.issues[0].message, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMagicLinkSent(true);
      toast({ title: 'Check Your Email', description: 'We sent you a magic link to sign in.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      toast({ title: 'Google Sign In Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px]" />
      </div>

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black tracking-[0.3em] uppercase">Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-gold blur-xl opacity-40"></div>
              <Dumbbell className="relative w-10 h-10 text-brand-gold" />
            </div>
            <span className="text-3xl font-extralight tracking-[0.5em] text-white">NZILA</span>
          </div>
          <p className="text-gray-500 font-light text-sm">
            {mode === 'signin' ? 'Welcome back to your gym' : 'Start your fitness journey'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-[2.5rem] p-10 border border-white/10">
          {/* Mode Switcher */}
          <div className="flex mb-10 p-1 bg-white/5 rounded-full">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase rounded-full transition-all ${
                mode === 'signin' 
                  ? 'bg-brand-gold text-black' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase rounded-full transition-all ${
                mode === 'signup' 
                  ? 'bg-brand-gold text-black' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 bg-brand-gold text-black font-black tracking-[0.2em] text-[11px] uppercase rounded-xl hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 py-6 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-brand-gold/50"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 bg-brand-gold text-black font-black tracking-[0.2em] text-[11px] uppercase rounded-xl hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/20"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-4 text-[9px] font-black tracking-[0.3em] uppercase text-gray-600">Or continue with</span>
            </div>
          </div>

          {/* Alternative Auth Methods */}
          <div className="space-y-4">
            <Button 
              type="button"
              variant="outline" 
              className="w-full py-6 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            {mode === 'signin' && (
              <Button 
                type="button"
                variant="outline" 
                className="w-full py-6 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-medium"
                onClick={handleMagicLink}
                disabled={loading || !email || magicLinkSent}
              >
                <Sparkles className="w-5 h-5 mr-3 text-brand-gold" />
                {magicLinkSent ? 'Magic Link Sent!' : 'Send Magic Link'}
              </Button>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[9px] text-gray-600 mt-8 tracking-wide">
            By continuing, you agree to our{' '}
            <a href="#" className="text-brand-gold hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-brand-gold hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
