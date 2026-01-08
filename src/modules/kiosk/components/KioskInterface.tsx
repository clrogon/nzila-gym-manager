import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, CheckCircle2, XCircle, AlertTriangle, Clock, Keyboard, ArrowLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type ScanResult = {
  status: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  member?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    status: string;
    membership_end_date: string | null;
    health_conditions?: string | null;
  };
};

export function KioskInterface() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanInput, setScanInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [checkInMode, setCheckInMode] = useState<'id' | 'pin'>('id');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (checkInMode === 'id') {
      inputRef.current?.focus();
    } else {
      pinInputRef.current?.focus();
    }

    const interval = setInterval(() => {
      if (checkInMode === 'id') {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      } else {
        if (document.activeElement !== pinInputRef.current) {
          pinInputRef.current?.focus();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInMode]);

  // Clear result after 5 seconds
  useEffect(() => {
    if (result) {
      const timeout = setTimeout(() => {
        setResult(null);
        setScanInput('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [result]);

  const checkInMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('check_ins').insert({
        gym_id: currentGym!.id,
        member_id: memberId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
    },
  });

  const pinCheckInMutation = useMutation({
    mutationFn: async (pin: string) => {
      // Look up member by phone (using last digits as PIN)
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, photo_url, status, membership_end_date, phone')
        .eq('gym_id', currentGym!.id)
        .ilike('phone', `%${pin}`)
        .limit(1);

      if (memberError) throw memberError;
      
      if (!members || members.length === 0) {
        return { success: false, message: 'Member not found with this PIN' };
      }

      const member = members[0];

      if (member.status !== 'active') {
        return { success: false, message: 'Membership is not active' };
      }

      // Create check-in
      const { error: checkInError } = await supabase.from('check_ins').insert({
        gym_id: currentGym!.id,
        member_id: member.id,
      });

      if (checkInError) throw checkInError;

      return {
        success: true,
        member_id: member.id,
        member_name: member.full_name,
        member_photo: member.photo_url,
      };
    },
    onSuccess: (data) => {
      if (data.success) {
        setResult({
          status: 'success',
          title: 'Welcome!',
          message: 'Have a great workout!',
          member: {
            id: data.member_id!,
            full_name: data.member_name!,
            photo_url: data.member_photo || null,
            status: 'active',
            membership_end_date: null,
          },
        });
        queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      } else {
        setResult({
          status: 'error',
          title: 'Access Denied',
          message: data.message || 'Check-in failed',
        });
      }
    },
    onError: (error) => {
      setResult({
        status: 'error',
        title: 'Error',
        message: error.message || 'Failed to process check-in',
      });
    },
  });

  const handlePinCheckIn = async (pin: string) => {
    if (!pin.trim() || !currentGym?.id || isProcessing) return;

    const sanitizedPin = pin.trim();

    if (!/^\d{4,6}$/.test(sanitizedPin)) {
      setResult({
        status: 'error',
        title: 'Invalid PIN',
        message: 'PIN must be 4-6 digits',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await pinCheckInMutation.mutateAsync(sanitizedPin);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScan = async (input: string) => {
    if (!input.trim() || !currentGym?.id || isProcessing) return;
    
    setIsProcessing(true);
    const sanitizedInput = input.trim();
    
    // Input validation - only allow UUID, email-like, or phone-like inputs
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
    
    if (sanitizedInput.length > 100) {
      setResult({
        status: 'error',
        title: 'Invalid Input',
        message: 'Search term is too long',
      });
      setIsProcessing(false);
      return;
    }
    
    try {
      let members: any[] | null = null;
      let error: any = null;
      
      // Use separate queries to prevent SQL injection
      if (UUID_REGEX.test(sanitizedInput)) {
        // Exact UUID match - safe parameterized query
        const result = await supabase
          .from('members')
          .select('id, full_name, photo_url, status, membership_end_date, health_conditions')
          .eq('gym_id', currentGym.id)
          .eq('id', sanitizedInput)
          .limit(1);
        members = result.data;
        error = result.error;
      } else if (EMAIL_REGEX.test(sanitizedInput)) {
        // Email search - use parameterized ilike
        const result = await supabase
          .from('members')
          .select('id, full_name, photo_url, status, membership_end_date, health_conditions')
          .eq('gym_id', currentGym.id)
          .ilike('email', `%${sanitizedInput.replace(/([\\%_])/g, '\\$1')}%`)
          .limit(1);
        members = result.data;
        error = result.error;
      } else if (PHONE_REGEX.test(sanitizedInput)) {
        // Phone search - use parameterized ilike
        const result = await supabase
          .from('members')
          .select('id, full_name, photo_url, status, membership_end_date, health_conditions')
          .eq('gym_id', currentGym.id)
          .ilike('phone', `%${sanitizedInput.replace(/([\\%_])/g, '\\$1')}%`)
          .limit(1);
        members = result.data;
        error = result.error;
      } else {
        // Invalid format - reject
        setResult({
          status: 'error',
          title: 'Invalid Format',
          message: 'Please enter a valid member ID, email, or phone number',
        });
        setIsProcessing(false);
        return;
      }

      if (error) throw error;

      if (!members || members.length === 0) {
        setResult({
          status: 'error',
          title: 'Member Not Found',
          message: 'No member found with this ID or contact',
        });
        return;
      }

      const member = members[0];

      // Check membership status
      if (member.status === 'suspended') {
        setResult({
          status: 'error',
          title: 'Access Denied',
          message: 'Membership is suspended. Please contact staff.',
          member,
        });
        return;
      }

      if (member.status === 'inactive') {
        setResult({
          status: 'error',
          title: 'Access Denied',
          message: 'Membership is inactive. Please renew your membership.',
          member,
        });
        return;
      }

      // Check membership expiry
      if (member.membership_end_date) {
        const endDate = new Date(member.membership_end_date);
        if (endDate < new Date()) {
          setResult({
            status: 'warning',
            title: 'Membership Expired',
            message: `Membership expired on ${endDate.toLocaleDateString()}`,
            member,
          });
          return;
        }
      }

      // Success - record check-in
      await checkInMutation.mutateAsync(member.id);

      setResult({
        status: 'success',
        title: 'Welcome!',
        message: member.health_conditions 
          ? `Health Note: ${member.health_conditions}`
          : 'Have a great workout!',
        member,
      });
    } catch (err) {
      setResult({
        status: 'error',
        title: 'Error',
        message: 'Failed to process. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (checkInMode === 'id') {
        handleScan(scanInput);
      } else {
        handlePinCheckIn(pinInput);
      }
    }
  };

  const statusConfig = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircle2,
      textColor: 'text-green-50',
    },
    error: {
      bg: 'bg-destructive',
      icon: XCircle,
      textColor: 'text-destructive-foreground',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: AlertTriangle,
      textColor: 'text-yellow-50',
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Exit Kiosk
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display">{currentGym?.name || 'GymFlow'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {result ? (
          // Result Display
          <div
            className={cn(
              'w-full max-w-2xl rounded-3xl p-12 text-center transition-all animate-in zoom-in-95',
              statusConfig[result.status].bg
            )}
          >
            {result.member?.photo_url && (
              <img
                src={result.member.photo_url}
                alt={result.member.full_name}
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white/30 object-cover"
              />
            )}
            <div className="mb-6">
              {(() => {
                const Icon = statusConfig[result.status].icon;
                return <Icon className={cn('w-20 h-20 mx-auto', statusConfig[result.status].textColor)} />;
              })()}
            </div>
            <h1 className={cn('text-4xl font-display font-bold mb-2', statusConfig[result.status].textColor)}>
              {result.title}
            </h1>
            {result.member && (
              <p className={cn('text-2xl font-medium mb-4', statusConfig[result.status].textColor)}>
                {result.member.full_name}
              </p>
            )}
            <p className={cn('text-xl opacity-90', statusConfig[result.status].textColor)}>
              {result.message}
            </p>
          </div>
         ) : (
          // Check-in Options
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Keyboard className="w-8 h-8 text-primary-foreground" />
              </div>

              <Tabs value={checkInMode} onValueChange={(v) => setCheckInMode(v as 'id' | 'pin')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="id" className="text-base">
                    Scan Card / Enter ID
                  </TabsTrigger>
                  <TabsTrigger value="pin" className="text-base">
                    Enter PIN
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="mt-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-display font-bold mb-4">
                      Scan Card or Enter ID
                    </h1>
                    <p className="text-muted-foreground mb-6">
                      Use scanner or type your member ID / email / phone
                    </p>
                    <Input
                      ref={inputRef}
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Scan or type here..."
                      className="text-center text-xl h-14 text-foreground"
                      autoFocus={checkInMode === 'id'}
                    />
                    <p className="text-sm text-muted-foreground mt-4">
                      Press Enter to check in
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="pin" className="mt-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-display font-bold mb-4">
                      Enter Your PIN
                    </h1>
                    <p className="text-muted-foreground mb-6">
                      Use the 4-6 digit PIN assigned to your account
                    </p>
                    <Input
                      ref={pinInputRef}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="••••"
                      className="text-center text-3xl h-16 text-foreground tracking-widest"
                      maxLength={6}
                      autoFocus={checkInMode === 'pin'}
                    />
                    <p className="text-sm text-muted-foreground mt-4">
                      Press Enter to check in
                    </p>
                    {user && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <User className="inline w-4 h-4 mr-1" />
                          Staff member: <strong>{user.email}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        Powered by GymFlow • {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}
