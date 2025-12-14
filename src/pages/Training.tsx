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
import { PolymorphicWodBuilder } from '@/components/training/PolymorphicWodBuilder';
import { WorkoutAssignment } from '@/components/training/WorkoutAssignment';
import { RankPromotion } from '@/components/training/RankPromotion';
import { GymContentCrud } from '@/components/training/GymContentCrud';
import { MemberProgressDashboard } from '@/components/training/MemberProgressDashboard';
import { TrainingLibraryView } from '@/components/training/TrainingLibraryView';
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
  Award,
  ClipboardList,
  Settings2,
  BookOpen,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState('library');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
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

  const handleDuplicateTemplate = async (template: WorkoutTemplate) => {
    if (!currentGym?.id) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const insertData = {
        gym_id: currentGym.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        difficulty: template.difficulty as 'beginner' | 'intermediate' | 'advanced' | null,
        estimated_duration: template.estimated_duration,
        is_public: false,
        exercises: template.exercises as unknown as any,
        created_by: userData?.user?.id || null,
      };
      const { error } = await supabase.from('workout_templates').insert(insertData);

      if (error) throw error;
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.id || !formData.name) {
      toast.error('Please enter a workout name');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        difficulty: formData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        estimated_duration: formData.estimated_duration,
        is_public: formData.is_public,
        exercises: formData.exercises.filter(e => e.name) as unknown as any,
      };
      const { error } = await supabase.from('workout_templates').update(updateData).eq('id', editingTemplate.id);

      if (error) throw error;
      toast.success('Workout template updated');
      setIsEditOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template');
    }
  };

  const openEditDialog = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || CATEGORIES[0] || 'Strength & Conditioning',
      difficulty: template.difficulty || 'intermediate',
      estimated_duration: template.estimated_duration || 60,
      is_public: template.is_public || false,
      exercises: (template.exercises || []).map((ex: any, i: number) => ({
        name: ex.name || ex.exercise || '',
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest: ex.rest || '60s',
        notes: ex.notes || '',
      })),
    });
    setIsEditOpen(true);
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
            <p className="text-muted-foreground">Manage workouts, assignments, and promotions</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Promotions</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Custom</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <TrainingLibraryView />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="flex justify-end mb-4">
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
                          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select value={formData.difficulty} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DIFFICULTIES.map(diff => (<SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input type="number" value={formData.estimated_duration} onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Description</Label>
                          <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the workout..." rows={2} />
                        </div>
                      </div>
                      <PolymorphicWodBuilder category={formData.category} exercises={formData.exercises.map((ex, i) => ({ id: String(i), ...ex }))} onChange={(exercises) => setFormData(prev => ({ ...prev, exercises: exercises as any }))} />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTemplate}>Create Template</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Edit Template Dialog */}
              <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingTemplate(null); resetForm(); } }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Workout Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
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
                        <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={formData.difficulty} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map(diff => (<SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input type="number" value={formData.estimated_duration} onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the workout..." rows={2} />
                      </div>
                    </div>
                    <PolymorphicWodBuilder category={formData.category} exercises={formData.exercises.map((ex, i) => ({ id: String(i), ...ex }))} onChange={(exercises) => setFormData(prev => ({ ...prev, exercises: exercises as any }))} />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingTemplate(null); resetForm(); }}>Cancel</Button>
                      <Button onClick={handleUpdateTemplate}>Save Changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="capitalize">{template.category}</CardDescription>
                      </div>
                      <Badge className={DIFFICULTY_COLORS[template.difficulty as keyof typeof DIFFICULTY_COLORS]}>{template.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{template.estimated_duration} min</span>
                      <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" />{template.exercises?.length || 0} exercises</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1"><Play className="w-4 h-4 mr-1" />Assign</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicateTemplate(template)} title="Duplicate"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="w-4 h-4" /></Button>
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
                  <p className="text-muted-foreground mb-4">Create your first workout template to get started</p>
                  <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Workout</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <WorkoutAssignment />
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <MemberProgressDashboard />
          </TabsContent>

          <TabsContent value="promotions" className="mt-6">
            <RankPromotion />
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <GymContentCrud />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
