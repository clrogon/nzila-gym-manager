import { useState, useMemo } from 'react';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getCategoryNames } from '@/lib/seedData';
import { useExercisesData } from '@/hooks/useExercisesData.tanstack';
import { useDisciplinesData } from '@/hooks/useDisciplinesData.tanstack';
import type { GymExercise, ExerciseFormData } from '@/hooks/useExercisesData.tanstack';
import {
  Plus, Search, Loader2, Edit2, Trash2, Dumbbell, Play, Filter
} from 'lucide-react';

const CATEGORIES = getCategoryNames();

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Abs', 'Obliques', 'Lower Back',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors',
  'Full Body', 'Cardio'
];

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Band', 'Cable Machine',
  'Bodyweight', 'Medicine Ball', 'Pull-up Bar', 'Bench', 'Squat Rack',
  'Treadmill', 'Rowing Machine', 'Bike', 'Jump Rope', 'Box', 'TRX', 'Other'
];

export function ExerciseLibrary() {
  const { currentGym } = useGym();

  // Use TanStack Query hook for exercise data
  const {
    exercises,
    loading,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useExercisesData(currentGym?.id);

  // Fetch disciplines for filter
  const { activeDisciplines } = useDisciplinesData(currentGym?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GymExercise | null>(null);
  const [deletingItem, setDeletingItem] = useState<GymExercise | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0] || '',
    equipment: '',
    instructions: '',
    muscle_groups: [] as string[],
    video_url: '',
    is_active: true,
    discipline_id: '' as string,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: CATEGORIES[0] || '',
      equipment: '',
      instructions: '',
      muscle_groups: [] as string[],
      video_url: '',
      is_active: true,
      discipline_id: '' as string,
    });
  };

  const handleCreate = async () => {
    if (!currentGym?.id || !formData.name.trim()) {
      toast.error('Insira um nome para o exercício');
      return;
    }

    setIsSubmitting(true);
    try {
      const exerciseData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        category: formData.category,
        equipment: formData.equipment,
        instructions: formData.instructions.trim() || '',
        muscle_groups: formData.muscle_groups.length > 0 ? formData.muscle_groups : [],
        video_url: formData.video_url.trim() || '',
        is_active: formData.is_active,
      };

      // Only include discipline_id if it has a value (after migration)
      if (formData.discipline_id) {
        exerciseData.discipline_id = formData.discipline_id;
      }

      await createExercise.mutateAsync(exerciseData as ExerciseFormData);

      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      // Toast is already handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem?.id || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateExercise.mutateAsync({
        id: editingItem.id,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        category: formData.category,
        equipment: formData.equipment,
        instructions: formData.instructions.trim() || '',
        muscle_groups: formData.muscle_groups.length > 0 ? formData.muscle_groups : [],
        video_url: formData.video_url.trim() || '',
        is_active: formData.is_active,
      });
      
      setIsEditOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      // Toast is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setIsSubmitting(true);
    try {
      await deleteExercise.mutateAsync(deletingItem.id);
      
      setIsDeleteOpen(false);
      setDeletingItem(null);
    } catch (error) {
      // Toast is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (item: GymExercise) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || CATEGORIES[0] || '',
      equipment: item.equipment || '',
      instructions: item.instructions || '',
      muscle_groups: item.muscle_groups || [],
      video_url: item.video_url || '',
      is_active: item.is_active ?? true,
      discipline_id: (item as any).discipline_id || '',
    });
    setIsEditOpen(true);
  };

  const toggleMuscleGroup = (muscle: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscle)
        ? prev.muscle_groups.filter(m => m !== muscle)
        : [...prev.muscle_groups, muscle]
    }));
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ex.category === filterCategory;
    const matchesMuscle = filterMuscle === 'all' || ex.muscle_groups?.includes(filterMuscle);
    const matchesEquipment = filterEquipment === 'all' || ex.equipment === filterEquipment;
    const exDisciplineId = (ex as any).discipline_id;
    const matchesDiscipline = filterDiscipline === 'all' || exDisciplineId === filterDiscipline;
    return matchesSearch && matchesCategory && matchesMuscle && matchesEquipment && matchesDiscipline;
  });

  const activeFiltersCount = [filterCategory, filterMuscle, filterEquipment].filter(f => f !== 'all').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Biblioteca de Exercícios</h2>
          <p className="text-sm text-muted-foreground">{exercises.length} exercícios no total</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Exercício
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar exercícios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant={showFilters ? "secondary" : "outline"} 
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Grupo muscular</Label>
                  <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os músculos</SelectItem>
                      {MUSCLE_GROUPS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Equipamento</Label>
                  <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos equipamentos</SelectItem>
                      {EQUIPMENT_OPTIONS.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeDisciplines && activeDisciplines.length > 0 && (
                  <div className="space-y-2">
                    <Label>Disciplina</Label>
                    <Select value={formData.discipline_id || ''} onValueChange={(v) => setFormData((prev: any) => ({ ...prev, discipline_id: v || '' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {activeDisciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {activeDisciplines && activeDisciplines.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Disciplina</Label>
                    <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as disciplinas</SelectItem>
                        {activeDisciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {exercises.length === 0 ? 'Nenhum exercício criado' : 'Nenhum exercício encontrado'}
            </p>
            <Button className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Exercício
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{exercise.name}</CardTitle>
                    <CardDescription className="capitalize">{exercise.category}</CardDescription>
                  </div>
                  <Badge variant={exercise.is_active ? 'default' : 'secondary'}>
                    {exercise.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {exercise.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {exercise.description}
                  </p>
                )}
                
                {/* Muscle Groups */}
                {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {exercise.muscle_groups.slice(0, 3).map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                    {exercise.muscle_groups.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{exercise.muscle_groups.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Equipment */}
                {exercise.equipment && (
                  <p className="text-xs text-muted-foreground mb-3">
                    <span className="font-medium">Equipamento:</span> {exercise.equipment}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  {exercise.video_url && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => { setViewingVideo(exercise.video_url); setIsVideoOpen(true); }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(exercise)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setDeletingItem(exercise); setIsDeleteOpen(true); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { 
        if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setEditingItem(null); } 
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Criar'} Exercício</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do exercício"
                />
              </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Equipamento</Label>
                  <Select value={formData.equipment} onValueChange={(v) => setFormData(prev => ({ ...prev, equipment: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_OPTIONS.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeDisciplines && activeDisciplines.length > 0 && (
                  <div className="space-y-2">
                    <Label>Disciplina</Label>
                    <Select value={formData.discipline_id} onValueChange={(v) => setFormData(prev => ({ ...prev, discipline_id: v || '' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {activeDisciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              <div className="space-y-2">
                <Label>Equipamento</Label>
                <Select value={formData.equipment} onValueChange={(v) => setFormData(prev => ({ ...prev, equipment: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grupos musculares</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                {MUSCLE_GROUPS.map((muscle) => (
                  <Badge
                    key={muscle}
                    variant={formData.muscle_groups.includes(muscle) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleMuscleGroup(muscle)}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do exercício"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Instruções</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instruções de execução"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                Cancelar
              </Button>
              <Button onClick={editingItem ? handleUpdate : handleCreate} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Tem certeza que deseja excluir o exercício "{deletingItem?.name}"?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vídeo do Exercício</DialogTitle>
          </DialogHeader>
          {viewingVideo && (
            <div className="aspect-video">
              <iframe
                src={viewingVideo}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
