import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { getCategoryNames } from '@/lib/seedData';
import {
  Plus, Search, Loader2, Edit2, Trash2, Dumbbell, GripVertical, 
  Clock, X, ChevronUp, ChevronDown, Copy
} from 'lucide-react';

interface GymExercise {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  muscle_groups: string[] | null;
}

interface WorkoutExercise {
  id: string;
  exercise_id?: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number;
  exercises: WorkoutExercise[];
  is_public: boolean;
  created_at: string;
}

const CATEGORIES = getCategoryNames();
const DIFFICULTIES = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function WorkoutTemplateBuilder() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<WorkoutTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0] || '',
    difficulty: 'intermediate',
    estimated_duration: 60,
    is_public: false,
    exercises: [] as WorkoutExercise[],
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchData();
    }
  }, [currentGym?.id]);

  const fetchData = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const [templatesRes, exercisesRes] = await Promise.all([
        supabase
          .from('workout_templates')
          .select('*')
          .eq('gym_id', currentGym.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('gym_exercises')
          .select('id, name, category, equipment, muscle_groups')
          .eq('gym_id', currentGym.id)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (exercisesRes.error) throw exercisesRes.error;

      const typedTemplates = (templatesRes.data || []).map(t => ({
        ...t,
        exercises: Array.isArray(t.exercises) 
          ? (t.exercises as unknown as WorkoutExercise[])
          : [],
      })) as WorkoutTemplate[];
      
      setTemplates(typedTemplates);
      setExercises(exercisesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: CATEGORIES[0] || '',
      difficulty: 'intermediate',
      estimated_duration: 60,
      is_public: false,
      exercises: [],
    });
  };

  const generateExerciseId = () => crypto.randomUUID();

  const addExercise = (gymExercise?: GymExercise) => {
    const newExercise: WorkoutExercise = {
      id: generateExerciseId(),
      exercise_id: gymExercise?.id,
      name: gymExercise?.name || '',
      sets: 3,
      reps: '10',
      rest: '60s',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));
    setIsExercisePickerOpen(false);
    setExerciseSearch('');
  };

  const removeExercise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== id),
    }));
  };

  const updateExercise = (id: string, field: keyof WorkoutExercise, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => 
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.exercises.length) return;

    const newExercises = [...formData.exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  };

  const handleCreate = async () => {
    if (!currentGym?.id || !formData.name.trim()) {
      toast.error('Insira um nome para o treino');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('workout_templates').insert({
        gym_id: currentGym.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        difficulty: formData.difficulty,
        estimated_duration: formData.estimated_duration,
        is_public: formData.is_public,
        exercises: formData.exercises.filter(e => e.name) as any,
        created_by: user?.id,
      });

      if (error) throw error;
      toast.success('Modelo de treino criado');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao criar modelo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate?.id || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('workout_templates').update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        difficulty: formData.difficulty,
        estimated_duration: formData.estimated_duration,
        is_public: formData.is_public,
        exercises: formData.exercises.filter(e => e.name) as any,
      }).eq('id', editingTemplate.id);

      if (error) throw error;
      toast.success('Modelo atualizado');
      setIsEditOpen(false);
      setEditingTemplate(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao atualizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('workout_templates').delete().eq('id', deletingTemplate.id);
      if (error) throw error;
      toast.success('Modelo eliminado');
      setIsDeleteOpen(false);
      setDeletingTemplate(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao eliminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template: WorkoutTemplate) => {
    if (!currentGym?.id) return;

    try {
      const { error } = await supabase.from('workout_templates').insert({
        gym_id: currentGym.id,
        name: `${template.name} (Cópia)`,
        description: template.description,
        category: template.category,
        difficulty: template.difficulty,
        estimated_duration: template.estimated_duration,
        is_public: false,
        exercises: template.exercises as any,
        created_by: user?.id,
      });

      if (error) throw error;
      toast.success('Modelo duplicado');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao duplicar');
    }
  };

  const openEditDialog = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || CATEGORIES[0] || '',
      difficulty: template.difficulty || 'intermediate',
      estimated_duration: template.estimated_duration || 60,
      is_public: template.is_public || false,
      exercises: (template.exercises || []).map(ex => ({
        id: ex.id || generateExerciseId(),
        exercise_id: ex.exercise_id,
        name: ex.name || '',
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest: ex.rest || '60s',
        notes: ex.notes || '',
      })),
    });
    setIsEditOpen(true);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const filteredExercisesForPicker = exercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

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
          <h2 className="text-xl font-semibold">Modelos de Treino</h2>
          <p className="text-sm text-muted-foreground">{templates.length} modelos criados</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Modelo
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar modelos..."
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
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {DIFFICULTIES.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {templates.length === 0 ? 'Nenhum modelo criado' : 'Nenhum modelo encontrado'}
            </p>
            <Button className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Modelo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    <CardDescription className="capitalize">{template.category}</CardDescription>
                  </div>
                  {template.difficulty && (
                    <Badge className={DIFFICULTY_COLORS[template.difficulty]} variant="outline">
                      {DIFFICULTIES.find(d => d.value === template.difficulty)?.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {template.exercises?.length || 0} exercícios
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {template.estimated_duration} min
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setDeletingTemplate(template); setIsDeleteOpen(true); }}>
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
        if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setEditingTemplate(null); } 
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar' : 'Criar'} Modelo de Treino</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome do Treino *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Treino de Força Superior"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração Estimada (min)</Label>
                <Input 
                  type="number" 
                  value={formData.estimated_duration} 
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))} 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Descreva o objetivo deste treino..."
                  rows={2}
                />
              </div>
            </div>

            {/* Exercises Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Exercícios ({formData.exercises.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsExercisePickerOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar da Biblioteca
                </Button>
              </div>

              {formData.exercises.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum exercício adicionado</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsExercisePickerOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Exercício
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                    >
                      <div className="flex flex-col gap-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === formData.exercises.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Exercício</Label>
                          <Input
                            value={exercise.name}
                            onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                            placeholder="Nome do exercício"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Séries</Label>
                          <Input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                            min={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Reps</Label>
                          <Input
                            value={exercise.reps}
                            onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                            placeholder="10 ou 8-12"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descanso</Label>
                          <Input
                            value={exercise.rest}
                            onChange={(e) => updateExercise(exercise.id, 'rest', e.target.value)}
                            placeholder="60s"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-3 space-y-1">
                          <Label className="text-xs">Notas</Label>
                          <Input
                            value={exercise.notes}
                            onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                            placeholder="Notas adicionais..."
                          />
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => addExercise()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exercício Manual
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={editingTemplate ? handleUpdate : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingTemplate ? 'Guardar' : 'Criar Modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Picker Dialog */}
      <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Exercício</DialogTitle>
            <DialogDescription>Escolha um exercício da sua biblioteca</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar exercícios..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px]">
              {filteredExercisesForPicker.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {exercises.length === 0 
                    ? 'Nenhum exercício na biblioteca. Crie exercícios primeiro.'
                    : 'Nenhum exercício encontrado'
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExercisesForPicker.map((ex) => (
                    <Button
                      key={ex.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => addExercise(ex)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.category} {ex.equipment && `• ${ex.equipment}`}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Modelo</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar "{deletingTemplate?.name}"? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
