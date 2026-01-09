import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { Building2, Plus, MoreVertical, Edit, Trash2, Crown, Building, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function MyGyms() {
  const { user } = useAuth();
  const { currentGym, gyms, setCurrentGym } = useGym();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'Africa/Luanda',
  });

  const [chainFormData, setChainFormData] = useState({
    name: '',
  });
  const [isChainDialogOpen, setIsChainDialogOpen] = useState(false);

  useEffect(() => {
    if (currentGym) {
      setFormData({
        name: currentGym.name || '',
        slug: currentGym.slug || '',
        address: currentGym.address || '',
        phone: currentGym.phone || '',
        email: currentGym.email || '',
        timezone: currentGym.timezone || 'Africa/Luanda',
      });
    }
  }, [currentGym]);

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const slug = formData.slug.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('gyms')
        .insert({
          name: formData.name,
          slug,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          timezone: formData.timezone,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          gym_id: error.id,
          role: 'gym_owner',
          relationship_type: 'owner',
          is_primary: true,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Gym Created',
        description: `Successfully created ${formData.name}`,
      });

      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'Africa/Luanda',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create gym',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast({
        title: 'Validation Error',
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const slug = formData.slug.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('gyms')
        .update({
          name: formData.name,
          slug: editingGym.id !== currentGym?.id ? slug : editingGym.slug,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          timezone: formData.timezone,
        })
        .eq('id', editingGym.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Gym Updated',
        description: `Successfully updated ${formData.name}`,
      });

      setEditingGym(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update gym',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGym = async (gymId: string) => {
    try {
      const { error: gymsError } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);

      if (gymsError) throw gymsError;

      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('gym_id', gymId);

      if (rolesError) throw rolesError;

      toast({
        title: 'Gym Deleted',
        description: 'Successfully deleted gym',
      });

      if (currentGym?.id === gymId) {
        setCurrentGym(null);
        navigate('/my-gyms');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete gym',
        variant: 'destructive',
      });
    }
  };

  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chainFormData.name) {
      toast({
        title: 'Validation Error',
        description: 'Chain name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('gym_chains')
        .insert({
          name: chainFormData.name,
          owner_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Chain Created',
        description: `Successfully created ${chainFormData.name}`,
      });

      setIsChainDialogOpen(false);
      setChainFormData({ name: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chain',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGyms = (gyms || []).filter(gym => {
    if (filterStatus !== 'all') {
      return gym.subscription_status === filterStatus;
    }
    return true;
  });

  const getMemberCount = (gymId: string) => {
    return (gyms || []).filter(g => g.id === gymId).reduce((sum, g) => {
      return sum + (g.member_count || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-80 border-r border-sidebar-border bg-sidebar">
          <div className="p-4 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">Meus Ginásios</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors">
              <Building2 className="w-5 h-5" />
              <span>Visão Geral</span>
            </Link>
            <Link to="/my-gyms" className="flex items-center gap-3 px-3 py-2 bg-primary text-primary-foreground rounded-lg transition-colors">
              <Building className="w-5 h-5" />
              <span className="font-medium">Meus Ginásios</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Meus Ginásios</h2>
              <p className="text-muted-foreground">
                Gerencie todos os seus ginásios em um só lugar
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Ginásio
              </Button>
              <Button onClick={() => setIsChainDialogOpen(true)} variant="outline">
                <Building2 className="w-4 h-4 mr-2" />
                Criar Cadeia
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Buscar ginásio..."
              className="max-w-xs"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as string)}
              className="border"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="trial">Trial</option>
              <option value="past_due">Atrasado</option>
              <option value="cancelled">Cancelados</option>
              <option value="expired">Expirados</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGyms.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold">Nenhum ginásio encontrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Crie seu primeiro ginásio ou adicione uma cadeia
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Ginásio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredGyms.map((gym: any) => (
                <Card key={gym.id} className={currentGym?.id === gym.id ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{gym.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={gym.subscription_status === 'active' ? 'default' : 'outline'}>
                          {gym.subscription_status === 'active' ? 'Ativo' : gym.subscription_status}
                        </Badge>
                        {currentGym?.id === gym.id && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingGym(gym); setFormData({ name: gym.name, slug: gym.slug, address: gym.address, phone: gym.phone, email: gym.email, timezone: gym.timezone }); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteGym(gym.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Users className="w-5 h-5" />
                        <span>{gym.member_count || 0} membros</span>
                      </div>
                      {gym.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span>{gym.address}</span>
                        </div>
                      )}
                      {gym.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{gym.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {currentGym?.id === gym.id ? (
                        <Button onClick={() => setCurrentGym(gym)} variant="outline" size="sm">
                          <Building className="w-4 h-4 mr-2" />
                          Voltar
                        </Button>
                      ) : (
                        <Button onClick={() => setCurrentGym(gym)} size="sm">
                          <Building className="w-4 h-4 mr-2" />
                          Acessar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Ginásio</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do seu ginásio. Você poderá criar múltiplos ginásios.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGym}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Ginásio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Gym Central"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="gym-central"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua Principal, nº, Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@ginasio.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Ginásio'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isChainDialogOpen} onOpenChange={setIsChainDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Cadeia de Ginásios</DialogTitle>
              <DialogDescription>
                Agrupe múltiplos ginásios para gerenciar recursos compartilhados.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChain}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chainName">Nome da Cadeia *</Label>
                  <Input
                    id="chainName"
                    value={chainFormData.name}
                    onChange={(e) => setChainFormData({ name: e.target.value })}
                    placeholder="Ex: Fitness Chain"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Cadeia'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>

        <Dialog open={!!editingGym} onOpenChange={(open) => !open && setEditingGym(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Ginásio</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do ginásio.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateGym}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome do Ginásio *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slug">Slug (URL) *</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Endereço</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Atualizando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
