import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Filter, RefreshCw, Loader2, User, Settings, CreditCard, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogViewerProps {
  gymId: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: 'Criação', color: 'bg-green-500/10 text-green-600' },
  UPDATE: { label: 'Atualização', color: 'bg-blue-500/10 text-blue-600' },
  DELETE: { label: 'Eliminação', color: 'bg-red-500/10 text-red-600' },
  LOGIN: { label: 'Login', color: 'bg-purple-500/10 text-purple-600' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-500/10 text-gray-600' },
  UPDATE_GYM_SETTINGS: { label: 'Definições', color: 'bg-orange-500/10 text-orange-600' },
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  member: Users,
  gym: Settings,
  payment: CreditCard,
  class: Calendar,
  user: User,
};

export function AuditLogViewer({ gymId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [gymId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'bg-gray-500/10 text-gray-600' };
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "dd MMM yyyy 'às' HH:mm", { locale: pt });
  };

  const EntityIcon = ({ type }: { type: string }) => {
    const Icon = ENTITY_ICONS[type] || Settings;
    return <Icon className="w-4 h-4" />;
  };

  const entityTypes = [...new Set(logs.map(l => l.entity_type))];

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">Registo de Auditoria</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Histórico de ações e alterações no sistema
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar ações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40 bg-background/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum registo encontrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const actionInfo = getActionInfo(log.action);
                const isExpanded = expandedLog === log.id;

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isExpanded 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border/30 bg-muted/20 hover:bg-muted/30'
                    }`}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <EntityIcon type={log.entity_type} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={actionInfo.color} variant="secondary">
                              {actionInfo.label}
                            </Badge>
                            <span className="text-sm font-medium">{log.entity_type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(log.created_at)}
                            {log.ip_address && ` • ${log.ip_address}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (log.old_values || log.new_values) && (
                      <div className="mt-4 pt-4 border-t border-border/30 animate-fade-in">
                        <div className="grid gap-4 md:grid-cols-2 text-xs">
                          {log.old_values && (
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                              <p className="font-medium text-red-600 mb-2">Valores Anteriores</p>
                              <pre className="whitespace-pre-wrap text-muted-foreground overflow-auto max-h-32">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                              <p className="font-medium text-green-600 mb-2">Novos Valores</p>
                              <pre className="whitespace-pre-wrap text-muted-foreground overflow-auto max-h-32">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
