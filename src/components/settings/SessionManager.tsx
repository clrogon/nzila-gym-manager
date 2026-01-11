import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Globe, LogOut, Shield, Clock, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string;
  ip: string;
  is_current: boolean;
}

interface AuthEvent {
  id: string;
  event_type: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export function SessionManager() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ created_at: string } | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, [user?.id]);

  const fetchSessionData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentSession({ created_at: session.user.created_at });
      }

      // Get recent auth events for this user
      const { data: events, error } = await supabase
        .from('auth_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && events) {
        setAuthEvents(events);
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await signOut();
      toast({ 
        title: 'Sessões Terminadas', 
        description: 'Foi terminada a sessão em todos os dispositivos.' 
      });
    } catch (error) {
      toast({ 
        title: 'Erro', 
        description: 'Falha ao terminar sessões.', 
        variant: 'destructive' 
      });
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone;
    }
    return Monitor;
  };

  const getDeviceName = (userAgent: string | null) => {
    if (!userAgent) return 'Dispositivo desconhecido';
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('mobile')) return 'Mobile Browser';
    
    return 'Browser';
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      login: { label: 'Login', color: 'bg-green-500/10 text-green-600' },
      logout: { label: 'Logout', color: 'bg-gray-500/10 text-gray-600' },
      token_refreshed: { label: 'Sessão renovada', color: 'bg-blue-500/10 text-blue-600' },
      user_updated: { label: 'Perfil atualizado', color: 'bg-purple-500/10 text-purple-600' },
      password_recovery: { label: 'Recuperação de senha', color: 'bg-orange-500/10 text-orange-600' },
    };
    return labels[eventType] || { label: eventType, color: 'bg-gray-500/10 text-gray-600' };
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">Sessões & Atividade</CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Gerir sessões ativas e histórico de autenticação
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSessionData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Current Session */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Sessão Atual</span>
                    <Badge className="bg-green-500/10 text-green-600">Ativa</Badge>
                  </div>
                  {currentSession && (
                    <p className="text-xs text-muted-foreground">
                      Iniciada {formatDistanceToNow(new Date(currentSession.created_at), { 
                        addSuffix: true, 
                        locale: pt 
                      })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terminar Todas
              </Button>
            </div>
          </div>

          {/* Auth Events */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Atividade Recente
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : authEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum evento de autenticação registado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {authEvents.map((event) => {
                  const DeviceIcon = getDeviceIcon(event.user_agent);
                  const eventInfo = getEventLabel(event.event_type);

                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={eventInfo.color} variant="secondary">
                              {eventInfo.label}
                            </Badge>
                            <span className="text-sm">{getDeviceName(event.user_agent)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {event.ip_address || 'IP desconhecido'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), "dd MMM 'às' HH:mm", { locale: pt })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security Tips */}
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Dica de Segurança</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Se não reconhece alguma atividade, altere a sua palavra-passe imediatamente e termine todas as sessões.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout All Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar Todas as Sessões?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá terminar a sessão em todos os dispositivos, incluindo este. Terá de iniciar sessão novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAllDevices}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminar Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
