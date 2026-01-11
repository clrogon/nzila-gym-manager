import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Flag,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  ToggleLeft,
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_gyms: string[];
  target_plans: string[];
  created_at: string;
  updated_at: string;
}

export default function FeatureFlagManager() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [targetPlans, setTargetPlans] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast({ title: 'Error', description: 'Failed to load feature flags', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        description: description || null,
        is_enabled: isEnabled,
        rollout_percentage: rolloutPercentage,
        target_plans: targetPlans ? targetPlans.split(',').map((p) => p.trim()) : [],
      };

      if (editing) {
        const { error } = await supabase
          .from('feature_flags')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Feature flag updated' });
      } else {
        const { error } = await supabase.from('feature_flags').insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Feature flag created' });
      }

      resetForm();
      setDialogOpen(false);
      fetchFlags();
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast({ title: 'Error', description: 'Failed to save feature flag', variant: 'destructive' });
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditing(flag);
    setName(flag.name);
    setDescription(flag.description || '');
    setIsEnabled(flag.is_enabled);
    setRolloutPercentage(flag.rollout_percentage);
    setTargetPlans(flag.target_plans?.join(', ') || '');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('feature_flags').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Feature flag deleted' });
      fetchFlags();
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast({ title: 'Error', description: 'Failed to delete feature flag', variant: 'destructive' });
    }
  };

  const toggleFlag = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !current })
        .eq('id', id);
      if (error) throw error;
      fetchFlags();
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIsEnabled(false);
    setRolloutPercentage(0);
    setTargetPlans('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enabledCount = flags.filter((f) => f.is_enabled).length;
  const partialRolloutCount = flags.filter((f) => f.rollout_percentage > 0 && f.rollout_percentage < 100).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-amber-500" />
            Feature Flags
          </h2>
          <p className="text-muted-foreground">Control feature rollouts across the platform</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Feature Flag' : 'Create Feature Flag'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Flag Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENABLE_NEW_DASHBOARD"
                  className="font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">Will be converted to UPPER_SNAKE_CASE</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this feature flag control?"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
              </div>
              <div className="space-y-2">
                <Label>Rollout Percentage: {rolloutPercentage}%</Label>
                <Slider
                  value={[rolloutPercentage]}
                  onValueChange={([v]) => setRolloutPercentage(v)}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  {rolloutPercentage === 0
                    ? 'Disabled for all'
                    : rolloutPercentage === 100
                    ? 'Enabled for all (when flag is on)'
                    : `Enabled for ~${rolloutPercentage}% of gyms`}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Target Plans (comma-separated)</Label>
                <Input
                  value={targetPlans}
                  onChange={(e) => setTargetPlans(e.target.value)}
                  placeholder="pro, enterprise"
                />
              </div>
              <Button type="submit" className="w-full">
                {editing ? 'Update' : 'Create'} Flag
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Flag className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{flags.length}</p>
                <p className="text-xs text-muted-foreground">Total Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledCount}</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partialRolloutCount}</p>
                <p className="text-xs text-muted-foreground">Partial Rollout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No feature flags yet</p>
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id} className={`${flag.is_enabled ? 'border-l-4 border-l-green-500' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={() => toggleFlag(flag.id, flag.is_enabled)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold">{flag.name}</code>
                        {flag.is_enabled ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">ON</Badge>
                        ) : (
                          <Badge variant="secondary">OFF</Badge>
                        )}
                        {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                          <Badge variant="outline">{flag.rollout_percentage}% rollout</Badge>
                        )}
                      </div>
                      {flag.description && (
                        <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                      )}
                      {flag.target_plans && flag.target_plans.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {flag.target_plans.map((plan) => (
                            <Badge key={plan} variant="outline" className="text-xs">
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(flag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{flag.name}" flag. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(flag.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
