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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getCategoryNames } from '@/lib/seedData';
import {
  Plus, Search, Loader2, Edit2, Trash2, Dumbbell, Calendar, ListChecks
} from 'lucide-react';

type ContentType = 'workouts' | 'classes' | 'exercises';

interface GymWorkout {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_duration: number | null;
  is_active: boolean;
}

interface GymClass {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  default_duration: number | null;
  default_capacity: number | null;
  color: string | null;
  is_active: boolean;
}

interface GymExercise {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  equipment: string | null;
  instructions: string | null;
  is_active: boolean;
}

const CATEGORIES = getCategoryNames();
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export function GymContentCrud() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ContentType>('workouts');
  const [workouts, setWorkouts] = useState<GymWorkout[]>([]);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0] || '',
    difficulty: 'intermediate',
    estimated_duration: 60,
    default_duration: 60,
    default_capacity: 20,
    color: '#3B82F6',
    equipment: '',
    instructions: '',
    is_active: true,
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchData();
    }
  }, [currentGym?.id, activeTab]);

  const fetchData = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'workouts') {
        const { data, error } = await supabase
          .from('gym_workouts')
          .select('*')
          .eq('gym_id', currentGym.id)
          .order('name');
        if (error) throw error;
        setWorkouts(data || []);
      } else if (activeTab === 'classes') {
        const { data, error } = await supabase
          .from('gym_classes')
          .select('*')
          .eq('gym_id', currentGym.id)
          .order('name');
        if (error) throw error;
        setClasses(data || []);
      } else {
        const { data, error } = await supabase
          .from('gym_exercises')
          .select('*')
          .eq('gym_id', currentGym.id)
          .order('name');
        if (error) throw error;
        setExercises(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
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
      default_duration: 60,
      default_capacity: 20,
      color: '#3B82F6',
      equipment: '',
      instructions: '',
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!currentGym?.id || !formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      let insertData: any = {
        gym_id: currentGym.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category || null,
        is_active: formData.is_active,
        created_by: user?.id,
      };

      if (activeTab === 'workouts') {
        insertData = {
          ...insertData,
          difficulty: formData.difficulty,
          estimated_duration: formData.estimated_duration,
        };
        const { error } = await supabase.from('gym_workouts').insert(insertData);
        if (error) throw error;
      } else if (activeTab === 'classes') {
        insertData = {
          ...insertData,
          default_duration: formData.default_duration,
          default_capacity: formData.default_capacity,
          color: formData.color,
        };
        const { error } = await supabase.from('gym_classes').insert(insertData);
        if (error) throw error;
      } else {
        insertData = {
          ...insertData,
          equipment: formData.equipment.trim() || null,
          instructions: formData.instructions.trim() || null,
        };
        const { error } = await supabase.from('gym_exercises').insert(insertData);
        if (error) throw error;
      }

      toast.success(`${activeTab.slice(0, -1)} created successfully`);
      setIsCreateOpen(false);
      resetForm();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem?.id || !formData.name.trim()) return;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsSubmitting(true);
    try {
      let updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category || null,
        is_active: formData.is_active,
      };

      if (activeTab === 'workouts') {
        updateData = {
          ...updateData,
          difficulty: formData.difficulty,
          estimated_duration: formData.estimated_duration,
        };
        const { error } = await supabase.from('gym_workouts').update(updateData).eq('id', editingItem.id);
        if (error) throw error;
      } else if (activeTab === 'classes') {
        updateData = {
          ...updateData,
          default_duration: formData.default_duration,
          default_capacity: formData.default_capacity,
          color: formData.color,
        };
        const { error } = await supabase.from('gym_classes').update(updateData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        updateData = {
          ...updateData,
          equipment: formData.equipment.trim() || null,
          instructions: formData.instructions.trim() || null,
        };
        const { error } = await supabase.from('gym_exercises').update(updateData).eq('id', editingItem.id);
        if (error) throw error;
      }

      toast.success(`${activeTab.slice(0, -1)} updated successfully`);
      setIsEditOpen(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setIsSubmitting(true);
    try {
      const table = activeTab === 'workouts' ? 'gym_workouts' : activeTab === 'classes' ? 'gym_classes' : 'gym_exercises';
      const { error } = await supabase.from(table).delete().eq('id', deletingItem.id);
      if (error) throw error;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.success(`${activeTab.slice(0, -1)} deleted successfully`);
      setIsDeleteOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || CATEGORIES[0] || '',
      difficulty: item.difficulty || 'intermediate',
      estimated_duration: item.estimated_duration || 60,
      default_duration: item.default_duration || 60,
      default_capacity: item.default_capacity || 20,
      color: item.color || '#3B82F6',
      equipment: item.equipment || '',
      instructions: item.instructions || '',
      is_active: item.is_active ?? true,
    });
    setIsEditOpen(true);
  };

  const getCurrentItems = () => {
    if (activeTab === 'workouts') return workouts;
    if (activeTab === 'classes') return classes;
    return exercises;
  };

  const filteredItems = getCurrentItems().filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTabIcon = (tab: ContentType) => {
    if (tab === 'workouts') return <Dumbbell className="w-4 h-4" />;
    if (tab === 'classes') return <Calendar className="w-4 h-4" />;
    return <ListChecks className="w-4 h-4" />;
  };

  const getTabLabel = (tab: ContentType) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Custom Gym Content</h2>
          <p className="text-sm text-muted-foreground">Create custom workouts, classes, and exercises for your gym</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add {getTabLabel(activeTab).slice(0, -1)}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
        <TabsList>
          {(['workouts', 'classes', 'exercises'] as ContentType[]).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex items-center gap-2">
              {getTabIcon(tab)}
              <span className="hidden sm:inline">{getTabLabel(tab)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Search */}
        <div className="relative max-w-md mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                {getTabIcon(activeTab)}
                <p className="text-muted-foreground mt-2">No custom {activeTab} yet</p>
                <Button className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First {getTabLabel(activeTab).slice(0, -1)}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="capitalize">{item.category}</CardDescription>
                      </div>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeletingItem(item); setIsDeleteOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateOpen || isEditOpen} 
        onOpenChange={(open) => { 
          if (!open) { 
            setIsCreateOpen(false); 
            setIsEditOpen(false); 
            setEditingItem(null); 
            resetForm();
          } 
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Create'} {getTabLabel(activeTab).slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`${getTabLabel(activeTab).slice(0, -1)} name`}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
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
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            {activeTab === 'workouts' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'classes' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={formData.default_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_duration: parseInt(e.target.value) || 60 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={formData.default_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_capacity: parseInt(e.target.value) || 20 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'exercises' && (
              <>
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Input
                    value={formData.equipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                    placeholder="e.g., Barbell, Dumbbells"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Exercise instructions..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setEditingItem(null); }}>
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {getTabLabel(activeTab).slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingItem(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
