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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getCategoryNames } from '@/lib/seedData';
import {
  Plus,
  Dumbbell,
  Clock,
  Target,
  Users,
  Trash2,
  Edit,
  Copy,
  Play,
  BarChart3,
  Trophy,
  Search,
} from 'lucide-react';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number;
  exercises: any[] | null;
  is_public: boolean | null;
  created_at: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

// Use categories from seed data
const CATEGORIES = getCategoryNames();
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function Training() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0] || 'Strength & Conditioning',
    difficulty: 'intermediate',
    estimated_duration: 60,
    is_public: false,
    exercises: [{ name: '', sets: 3, reps: '10', rest: '60s', notes: '' }] as Exercise[],
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchTemplates();
    }
  }, [currentGym?.id]);

  const fetchTemplates = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast exercises from Json to array
      const typedData = (data || []).map(item => ({
        ...item,
        exercises: Array.isArray(item.exercises) ? item.exercises : [],
      })) as WorkoutTemplate[];
      setTemplates(typedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!currentGym?.id || !formData.name) {
      toast.error('Please enter a workout name');
      return;
    }

    try {
      const insertData = {
        gym_id: currentGym.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        difficulty: formData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        estimated_duration: formData.estimated_duration,
        is_public: formData.is_public,
        exercises: formData.exercises.filter(e => e.name) as unknown as any,
      };
      const { error } = await supabase.from('workout_templates').insert(insertData);

      if (error) throw error;
      toast.success('Workout template created');
      setIsCreateOpen(false);
      fetchTemplates();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('workout_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: CATEGORIES[0] || 'Strength & Conditioning',
      difficulty: 'intermediate',
      estimated_duration: 60,
      is_public: false,
      exercises: [{ name: '', sets: 3, reps: '10', rest: '60s', notes: '' }],
    });
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: '10', rest: '60s', notes: '' }],
    }));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select a gym first.</p>
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
            <h1 className="text-2xl font-display font-bold text-foreground">Training Hub</h1>
            <p className="text-muted-foreground">Create and manage workout programs</p>
          </div>

          {hasPermission('training:create') && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Workout Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Workout Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Full Body Strength"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTIES.map(diff => (
                            <SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the workout..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Exercises</Label>
                      <Button variant="outline" size="sm" onClick={addExercise}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Exercise
                      </Button>
                    </div>

                    {formData.exercises.map((exercise, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-12 sm:col-span-4">
                            <Label className="text-xs">Exercise Name</Label>
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              placeholder="e.g., Squats"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 3)}
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <Label className="text-xs">Reps</Label>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                              placeholder="10"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <Label className="text-xs">Rest</Label>
                            <Input
                              value={exercise.rest}
                              onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                              placeholder="60s"
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-2 flex items-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeExercise(index)}
                              disabled={formData.exercises.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Create Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search workouts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {DIFFICULTIES.map(diff => (
                    <SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.filter(t => t.difficulty === 'beginner').length}</p>
                  <p className="text-sm text-muted-foreground">Beginner</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <BarChart3 className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.filter(t => t.difficulty === 'intermediate').length}</p>
                  <p className="text-sm text-muted-foreground">Intermediate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <Trophy className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.filter(t => t.difficulty === 'advanced').length}</p>
                  <p className="text-sm text-muted-foreground">Advanced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="capitalize">{template.category}</CardDescription>
                  </div>
                  <Badge className={DIFFICULTY_COLORS[template.difficulty as keyof typeof DIFFICULTY_COLORS]}>
                    {template.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {template.estimated_duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {template.exercises?.length || 0} exercises
                  </span>
                </div>

                {template.exercises && template.exercises.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {template.exercises.slice(0, 3).map((ex: Exercise, i: number) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <span>{ex.name}</span>
                        <span className="text-muted-foreground ml-auto">
                          {ex.sets}×{ex.reps}
                        </span>
                      </div>
                    ))}
                    {template.exercises.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        +{template.exercises.length - 3} more exercises
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workout templates found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workout template to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
