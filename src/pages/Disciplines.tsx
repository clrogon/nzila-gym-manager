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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  getCategoryNames, hasBeltSystem, getDisciplineRanks, 
  DEFAULT_WORKOUT_CATEGORIES, getCategoryByName 
} from '@/lib/seedData';
import {
  Search, Plus, Award, Users, Settings2, ChevronRight,
  GraduationCap, Shield, Swords, Activity, Loader2, 
  Dumbbell, Calendar, ListChecks, Edit2, Trash2
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

// Generic item for workouts, classes, exercises (stored in workout_templates or custom tables)
interface TrainingItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: 'workout' | 'class' | 'exercise';
  is_active?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Combat Sports / Martial Arts": <Swords className="w-4 h-4" />,
  "Strength & Conditioning": <Dumbbell className="w-4 h-4" />,
  "Mind-Body Practices": <GraduationCap className="w-4 h-4" />,
  "Cardiovascular Training": <Activity className="w-4 h-4" />,
  "Group Fitness Classes": <Users className="w-4 h-4" />,
  "Aquatic Activities": <Activity className="w-4 h-4" />,
};

type TabType = 'disciplines' | 'workouts' | 'classes' | 'exercises';

export default function Disciplines() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState<TabType>('disciplines');
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [ranks, setRanks] = useState<DisciplineRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [isSeedingRanks, setIsSeedingRanks] = useState(false);

  // CRUD Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: '' });
  const [editingItem, setEditingItem] = useState<Discipline | null>(null);
  const [deletingItem, setDeletingItem] = useState<Discipline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getCategoryNames();

  useEffect(() => {
    if (currentGym?.id) {
      fetchDisciplines();
    }
  }, [currentGym?.id]);

  useEffect(() => {
    if (selectedDiscipline) {
      fetchRanks(selectedDiscipline.id);
    }
  }, [selectedDiscipline]);

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
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      toast.error('Failed to load disciplines');
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
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const toggleDisciplineActive = async (discipline: Discipline) => {
    try {
      const { error } = await supabase
        .from('disciplines')
        .update({ is_active: !discipline.is_active })
        .eq('id', discipline.id);

      if (error) throw error;
      toast.success(`${discipline.name} ${!discipline.is_active ? 'enabled' : 'disabled'}`);
      fetchDisciplines();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update discipline');
    }
  };

  const seedRanksForDiscipline = async (discipline: Discipline) => {
    if (!hasBeltSystem(discipline.name)) {
      toast.error('This discipline does not have a predefined belt system');
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
      toast.success(`${rankSeeds.length} ranks created for ${discipline.name}`);
      fetchRanks(discipline.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed ranks');
    } finally {
      setIsSeedingRanks(false);
    }
  };

  // CRUD Operations
  const handleCreate = async () => {
    if (!currentGym?.id || !formData.name.trim()) return;
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
      toast.success('Discipline created successfully');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', category: '' });
      fetchDisciplines();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create discipline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem?.id || !formData.name.trim()) return;
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
      toast.success('Discipline updated successfully');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', category: '' });
      fetchDisciplines();
      if (selectedDiscipline?.id === editingItem.id) {
        setSelectedDiscipline(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update discipline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('disciplines')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;
      toast.success('Discipline deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      if (selectedDiscipline?.id === deletingItem.id) {
        setSelectedDiscipline(null);
      }
      fetchDisciplines();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete discipline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (discipline: Discipline) => {
    setEditingItem(discipline);
    setFormData({
      name: discipline.name,
      description: discipline.description || '',
      category: discipline.category || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (discipline: Discipline) => {
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
    const cat = d.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, Discipline[]>);

  // Get seed data for current tab
  const getSeedDataForTab = () => {
    const category = filterCategory === 'all' ? null : getCategoryByName(filterCategory);
    
    if (activeTab === 'workouts') {
      if (category) return category.workouts.map(w => ({ name: w, category: filterCategory }));
      return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.workouts.map(w => ({ name: w, category: c.name })));
    }
    if (activeTab === 'classes') {
      if (category) return category.classes.map(c => ({ name: c, category: filterCategory }));
      return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.classes.map(cl => ({ name: cl, category: c.name })));
    }
    if (activeTab === 'exercises') {
      if (category) return category.exercises.map(e => ({ name: e, category: filterCategory }));
      return DEFAULT_WORKOUT_CATEGORIES.flatMap(c => c.exercises.map(e => ({ name: e, category: c.name })));
    }
    return [];
  };

  const seedData = getSeedDataForTab();
  const filteredSeedData = seedData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: disciplines.length,
    active: disciplines.filter(d => d.is_active).length,
    withRanks: disciplines.filter(d => hasBeltSystem(d.name)).length,
    categories: new Set(disciplines.map(d => d.category)).size,
  };

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
            <h1 className="text-2xl font-display font-bold text-foreground">Training Library</h1>
            <p className="text-muted-foreground">Manage disciplines, workouts, classes, and exercises</p>
          </div>
          {activeTab === 'disciplines' && hasPermission('training:create') && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Discipline
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="disciplines" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Disciplines</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Exercises</span>
            </TabsTrigger>
          </TabsList>

          {/* Stats - Only show for disciplines tab */}
          {activeTab === 'disciplines' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
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
                      <p className="text-sm text-muted-foreground">Active</p>
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
                      <p className="text-sm text-muted-foreground">With Belts</p>
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
                      <p className="text-sm text-muted-foreground">Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Disciplines Tab Content */}
          <TabsContent value="disciplines" className="mt-4">
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
                      <p className="text-muted-foreground">No disciplines found</p>
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
                        <CardDescription>{items.length} disciplines</CardDescription>
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
                                      Belt System
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => { e.stopPropagation(); openEditDialog(discipline); }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); openDeleteDialog(discipline); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Switch
                                  checked={discipline.is_active}
                                  onCheckedChange={() => toggleDisciplineActive(discipline)}
                                  onClick={(e) => e.stopPropagation()}
                                />
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

              {/* Detail Panel */}
              <div className="space-y-4">
                {selectedDiscipline ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {selectedDiscipline.name}
                        <Badge variant={selectedDiscipline.is_active ? 'default' : 'secondary'}>
                          {selectedDiscipline.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{selectedDiscipline.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {selectedDiscipline.description || 'No description available'}
                      </p>
                      {hasBeltSystem(selectedDiscipline.name) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Belt/Rank System</Label>
                            {ranks.length === 0 && (
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
                                Seed Default Ranks
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
                                    Lv. {rank.level}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No ranks configured yet
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
                      <p className="text-muted-foreground">Select a discipline to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Workouts/Classes/Exercises Tab Content (Read-only seed data display) */}
          {['workouts', 'classes', 'exercises'].map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{tabKey} Library</CardTitle>
                  <CardDescription>
                    Default {tabKey} from the training library. These serve as templates for creating gym-specific content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredSeedData.length === 0 ? (
                    <div className="text-center py-12">
                      <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No {tabKey} found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(
                        filteredSeedData.reduce((acc, item) => {
                          if (!acc[item.category]) acc[item.category] = [];
                          acc[item.category].push(item.name);
                          return acc;
                        }, {} as Record<string, string[]>)
                      ).map(([category, items]) => (
                        <Card key={category} className="border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {CATEGORY_ICONS[category] || <Activity className="w-4 h-4" />}
                              {category}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <ul className="space-y-1">
                              {items.map((item, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discipline</DialogTitle>
            <DialogDescription>Add a new training discipline to your gym.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Brazilian Jiu-Jitsu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this discipline"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Discipline</DialogTitle>
            <DialogDescription>Update the discipline details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discipline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
