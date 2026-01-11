import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw, Loader2, Check, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  permissions: string[];
}

interface ApiKeyManagerProps {
  gymId: string;
  gymSettings: Record<string, unknown>;
  canEdit: boolean;
  onSave: () => Promise<void>;
}

const PERMISSIONS = [
  { id: 'read:members', label: 'Ler membros' },
  { id: 'write:members', label: 'Modificar membros' },
  { id: 'read:classes', label: 'Ler aulas' },
  { id: 'write:classes', label: 'Modificar aulas' },
  { id: 'read:payments', label: 'Ler pagamentos' },
  { id: 'read:checkins', label: 'Ler check-ins' },
  { id: 'write:checkins', label: 'Criar check-ins' },
];

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'nzila_';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function ApiKeyManager({ gymId, gymSettings, canEdit, onSave }: ApiKeyManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // New key form
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read:members', 'read:classes']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    if (gymSettings?.api_keys) {
      setKeys(gymSettings.api_keys as unknown as ApiKey[]);
    }
  }, [gymSettings]);

  const saveKeys = async (updatedKeys: ApiKey[]) => {
    try {
      const newSettings = {
        ...gymSettings,
        api_keys: updatedKeys,
      } as unknown as Json;

      const { error } = await supabase
        .from('gyms')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq('id', gymId);

      if (error) throw error;

      setKeys(updatedKeys);
      await onSave();
    } catch (error) {
      console.error('Failed to save API keys:', error);
      throw error;
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name: newKeyName.trim(),
        key: generateApiKey(),
        created_at: new Date().toISOString(),
        last_used: null,
        is_active: true,
        permissions: newKeyPermissions,
      };

      await saveKeys([...keys, newKey]);
      setGeneratedKey(newKey.key);
      toast({ title: 'Chave Criada', description: 'A nova chave API foi criada com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao criar chave.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKey = async (keyId: string) => {
    const updatedKeys = keys.map(k =>
      k.id === keyId ? { ...k, is_active: !k.is_active } : k
    );
    
    try {
      await saveKeys(updatedKeys);
      toast({ title: 'Estado Atualizado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar estado.', variant: 'destructive' });
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;

    setLoading(true);
    try {
      const updatedKeys = keys.filter(k => k.id !== deleteKeyId);
      await saveKeys(updatedKeys);
      setDeleteKeyId(null);
      toast({ title: 'Chave Eliminada', description: 'A chave API foi removida.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao eliminar chave.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: 'Copiado!', description: 'Chave copiada para a área de transferência.' });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 10) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  const closeNewKeyDialog = () => {
    setShowNewKeyDialog(false);
    setNewKeyName('');
    setNewKeyPermissions(['read:members', 'read:classes']);
    setGeneratedKey(null);
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">Chaves API</CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Gerir chaves de acesso para integrações externas
                </CardDescription>
              </div>
            </div>
            {canEdit && (
              <Button onClick={() => setShowNewKeyDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Chave
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {keys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="mb-2">Nenhuma chave API criada</p>
              <p className="text-sm">Crie uma chave para integrar com sistemas externos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    apiKey.is_active 
                      ? 'border-border/30 bg-muted/20 hover:bg-muted/30' 
                      : 'border-border/20 bg-muted/10 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Key className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Criada em {format(new Date(apiKey.created_at), 'dd/MM/yyyy')}
                          {apiKey.last_used && ` • Último uso: ${format(new Date(apiKey.last_used), 'dd/MM/yyyy')}`}
                        </p>
                      </div>
                    </div>
                    
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.is_active}
                          onCheckedChange={() => handleToggleKey(apiKey.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteKeyId(apiKey.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 font-mono text-sm">
                    <code className="flex-1 truncate">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      {copiedKey === apiKey.key ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {apiKey.permissions.map(perm => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {PERMISSIONS.find(p => p.id === perm)?.label || perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Key Dialog */}
      <AlertDialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {generatedKey ? 'Chave Criada com Sucesso' : 'Nova Chave API'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {generatedKey 
                ? 'Copie a chave agora. Por segurança, não será possível visualizá-la novamente.'
                : 'Configure a nova chave de acesso API.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <code className="text-sm font-mono break-all">{generatedKey}</code>
              </div>
              <Button className="w-full" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Chave
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Chave</Label>
                <Input
                  placeholder="Ex: Integração Website"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map(perm => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        newKeyPermissions.includes(perm.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={newKeyPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyPermissions([...newKeyPermissions, perm.id]);
                          } else {
                            setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm.id));
                          }
                        }}
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeNewKeyDialog}>
              {generatedKey ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {!generatedKey && (
              <AlertDialogAction onClick={handleCreateKey} disabled={loading || !newKeyName.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Chave'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Chave API?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Qualquer integração que use esta chave deixará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
