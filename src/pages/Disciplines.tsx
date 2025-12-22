import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getCategoryNames, hasBeltSystem, getDisciplineRanks } from '@/lib/seedData';
import {
  Search, Plus, Award, Users, Settings2, ChevronRight,
  GraduationCap, Shield, Swords, Activity, Loader2, Edit2, Trash2, ShieldAlert
} from 'lucide-react';

interface Discipline {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

interface DisciplineRank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string | null;
  requirements: string | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Combat Sports / Martial Arts": <Swords className="w-4 h-4" />,
  "Strength & Conditioning": <Activity className="w-4 h-4" />,
  "Mind-Body Practices": <GraduationCap className="w-4 h-4" />,
  "Cardiovascular Training": <Activity className="w-4 h-4" />,
  "Group Fitness Classes": <Users className="w-4 h-4" />,
  "Aquatic Activities": <Activity className="w-4 h-4" />,
};

export default function Disciplines() {
  const { currentGym } = useGym();
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [ranks, setRanks] = useState<DisciplineRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [isSeedingRanks, setIsSeedingRanks] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '' });
  const [editingItem, setEditingItem] = useState<Discipline | null>(null);
  const [deletingItem, setDeletingItem] = useState<Discipline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = getCategoryNames();

  // Permission checks
  const canView = hasPermission('training:read');
  const canCreate = hasPermission('training:create');
  const canUpdate = hasPermission('training:update');
  const canDelete = hasPermission('training:delete');

  useEffect(() => {
    if (currentGym?.id && !rbacLoading && canView) {
      fetchDisciplines();
    } else if (!rbacLoading) {
      setLoading(false);
    }
  }, [currentGym?.id, rbacLoading, canView]);

  useEffect(() => {
    if (selectedDiscipline && canView) {
      fetchRanks(selectedDiscipline.id);
    }
  }, [selectedDiscipline, canView]);

  const fetchDisciplines = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setDisciplines(data || []);
    } catch (error: any) {
      console.error('Failed to load disciplines:', error?.message);
      toast.error('Falha ao carregar disciplinas');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanks = async (disciplineId: string) => {
    try {
      const { data, error } = await supabase
        .from('discipline_ranks')
        .select('*')
        .eq('discipline_id', disciplineId)
        .order('level', { ascending: true });

      if (error) throw error;
      setRanks(data || []);
    } catch (error: any) {
      console.error('Failed to load ranks:', error?.message);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome não pode exceder 100 caracteres';
    }

    if (formData.description.trim().length > 500) {
      newErrors.description = 'Descrição não pode exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDisciplineActive = async (discipline: Discipline) => {
    if (!canUpdate) {
      toast.error('Não tem permissão para modificar disciplinas');
      return;
    }

    try {
      // Check impact before disabling
      if (discipline.is_active) {
        const { count: classCount } = await supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('discipline_id', discipline.id)
          .eq('status', 'scheduled');

        if (classCount && classCount > 0) {
          const confirmed = window.confirm(
            `Desativar "${discipline.name}" irá ocultar ${classCount} aulas agendadas do calendário.\n\nDeseja continuar?`
          );
          if (!confirmed) return;
        }
      }

      const { error } = await supabase
        .from('disciplines')
        .update({ is_active: !discipline.is_active })
        .eq('id', discipline.id);

      if (error) throw error;
      toast.success(`${discipline.name} ${!discipline.is_active ? 'ativada' : 'desativada'}`);
      fetchDisciplines();
    } catch (error: any) {
      console.error('Toggle failed:', error?.message);
      toast.error('Falha ao atualizar disciplina');
    }
  };

  const seedRanksForDiscipline = async (discipline: Discipline) => {
    if (!canCreate) {
      toast.error('Não tem permissão para criar graus');
      return;
    }

    if (!hasBeltSystem(discipline.name)) {
      toast.error('Esta disciplina não tem um sistema de graus predefinido');
      return;
    }

    setIsSeedingRanks(true);
    try {
      const rankSeeds = getDisciplineRanks(discipline.name);
      const ranksToInsert = rankSeeds.map(r => ({
        discipline_id: discipline.id,
        name: r.name,
        level: r.level,
        color: r.color,
        requirements: r.requirements,
      }));

      const { error } = await supabase
        .from('discipline_ranks')
        .insert(ranksToInsert);

      if (error) throw error;
      toast.success(`${rankSeeds.length} graus criados para ${discipline.name}`);
      fetchRanks(discipline.id);
    } catch (error: any) {
      console.error('Seed ranks failed:', error?.message);
      toast.error('Falha ao criar graus');
    } finally {
      setIsSeedingRanks(false);
    }
  };

  const handleCreate = async () => {
    if (!currentGym?.id || !canCreate) {
      toast.error('Não tem permissão para criar disciplinas');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor corrija os erros antes de guardar');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('disciplines').insert({
        gym_id: currentGym.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category || null,
        is_active: true,
      });

      if (error) throw error;
      toast.success('Disciplina criada com sucesso');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', category: '' });
      setErrors({});
      fetchDisciplines();
    } catch (error: any) {
      console.error('Create failed:', error?.message);
      toast.error('Falha ao criar disciplina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem?.id || !canUpdate) {
      toast.error('Não tem permissão para editar disciplinas');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor corrija os erros antes de guardar');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('disciplines')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category || null,
        })
        .eq('id', editingItem.id);

      if (error) throw error;
      toast.success('Disciplina atualizada com sucesso');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', category: '' });
      setErrors({});
      fetchDisciplines();
      if (selectedDiscipline?.id === editingItem.id) {
        setSelectedDiscipline(null);
      }
    } catch (error: any) {
      console.error('Update failed:', error?.message);
      toast.error('Falha ao atualizar disciplina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id || !canDelete) {
      toast.error('Não tem permissão para eliminar disciplinas');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('disciplines')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;
      toast.success('Disciplina eliminada com sucesso');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      if (selectedDiscipline?.id === deletingItem.id) {
        setSelectedDiscipline(null);
      }
      fetchDisciplines();
    } catch (error: any) {
      console.error('Delete failed:', error?.message);
      toast.error('Falha ao eliminar disciplina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (discipline: Discipline) => {
    if (!canUpdate) {
      toast.error('Não tem permissão para editar disciplinas');
      return;
    }
    setEditingItem(discipline);
    setFormData({
      name: discipline.name,
      description: discipline.description || '',
      category: discipline.category || '',
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (discipline: Discipline) => {
    if (!canDelete) {
      toast.error('Não tem permissão para eliminar disciplinas');
      return;
    }
    setDeletingItem(discipline);
    setIsDeleteDialogOpen(true);
  };

  const filteredDisciplines = disciplines.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedDisciplines = filteredDisciplines.reduce((acc, d) => {
    const cat = d.category || 'Outro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, Discipline[]>);

  const stats = {
    total: disciplines.length,
    active: disciplines.filter(d => d.is_active).length,
    withRanks: disciplines.filter(d => hasBeltSystem(d.name)).length,
    categories: new Set(disciplines.map(d => d.category)).size,
  };

  // Guards
  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Por favor, selecione um ginásio primeiro.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (rbacLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Não tem permissão para ver disciplinas.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Disciplinas</h1>
            <p className="text-muted-foreground">Gerir modalidades e sistema de graus</p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disciplina
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withRanks}</p>
                  <p className="text-sm text-muted-foreground">Com Graus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.categories}</p>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar disciplinas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disciplines List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : Object.keys(groupedDisciplines).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedDisciplines).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {CATEGORY_ICONS[category] || <Activity className="w-4 h-4" />}
                      {category}
                    </CardTitle>
                    <CardDescription>{items.length} disciplinas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {items.map(discipline => (
                        <div
                          key={discipline.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                            selectedDiscipline?.id === discipline.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedDiscipline(discipline)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${discipline.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                            <div>
                              <p className="font-medium">{discipline.name}</p>
                              {hasBeltSystem(discipline.name) && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  <Award className="w-3 h-3 mr-1" />
                                  Sistema de Graus
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(discipline); }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); openDeleteDialog(discipline); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {canUpdate && (
                              <Switch
                                checked={discipline.is_active}
                                onCheckedChange={() => toggleDisciplineActive(discipline)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detail Panel - Ranks */}
          <div className="space-y-4">
            {selectedDiscipline ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedDiscipline.name}
                    <Badge variant={selectedDiscipline.is_active ? 'default' : 'secondary'}>
                      {selectedDiscipline.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedDiscipline.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedDiscipline.description || 'Sem descrição disponível'}
                  </p>
                  {hasBeltSystem(selectedDiscipline.name) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Sistema de Graus</Label>
                        {ranks.length === 0 && canCreate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => seedRanksForDiscipline(selectedDiscipline)}
                            disabled={isSeedingRanks}
                          >
                            {isSeedingRanks ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            Criar Graus Padrão
                          </Button>
                        )}
                      </div>
                      {ranks.length > 0 ? (
                        <div className="space-y-2">
                          {ranks.map(rank => (
                            <div
                              key={rank.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                            >
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: rank.color || '#ccc' }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{rank.name}</p>
                                <p className="text-xs text-muted-foreground">{rank.requirements}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Nível {rank.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Ainda sem graus configurados
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Settings2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Selecione uma disciplina para ver detalhes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Disciplina</DialogTitle>
            <DialogDescription>Adicione uma nova disciplina de treino ao seu ginásio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Jiu-Jitsu Brasileiro"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição desta disciplina"
                rows={3}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
            <DialogDescription>Atualizar os detalhes da disciplina.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Disciplina</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar "{deletingItem?.name}"? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
