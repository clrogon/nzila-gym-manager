import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Settings,
  Zap,
  Users,
  AlertCircle,
} from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  email: string | null;
  subscription_status: string | null;
}

interface PlatformFeature {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface GymFeatureOverride {
  id: string;
  gym_id: string;
  feature_id: string;
  is_enabled: boolean;
  custom_limits: any;
}

export default function GymManagementEnhanced() {
  const { toast } = useToast();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [gymFeatures, setGymFeatures] = useState<GymFeatureOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Gym limits state
  const [maxMembers, setMaxMembers] = useState('100');
  const [maxStaff, setMaxStaff] = useState('5');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gymsRes, featuresRes] = await Promise.all([
        supabase.from('gyms').select('*').order('name'),
        supabase.from('platform_features').select('*'),
      ]);

      if (gymsRes.error) throw gymsRes.error;
      if (featuresRes.error) throw featuresRes.error;

      setGyms(gymsRes.data || []);
      setFeatures(featuresRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gyms and features.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGym = async (gym: Gym) => {
    setSelectedGym(gym);
    await fetchGymFeatures(gym.id);
    setDetailsDialogOpen(true);
  };

  const fetchGymFeatures = async (gymId: string) => {
    try {
      const { data, error } = await supabase
        .from('gym_feature_overrides')
        .select('*')
        .eq('gym_id', gymId);

      if (error) throw error;
      setGymFeatures(data || []);

      // Load limits
      const limitsOverride = data?.find(
        (f) => f.custom_limits?.max_members !== undefined
      );
      if (limitsOverride) {
        setMaxMembers(limitsOverride.custom_limits.max_members || '100');
        setMaxStaff(limitsOverride.custom_limits.max_staff || '5');
      }
    } catch (error) {
      console.error('Error fetching gym features:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gym features.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeature = async (
    featureId: string,
    currentState: boolean
  ) => {
    if (!selectedGym) return;

    try {
      const existing = gymFeatures.find((f) => f.feature_id === featureId);

      if (existing) {
        const { error } = await supabase
          .from('gym_feature_overrides')
          .update({ is_enabled: !currentState })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gym_feature_overrides')
          .insert([
            {
              gym_id: selectedGym.id,
              feature_id: featureId,
              is_enabled: true,
            },
          ]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Feature updated.',
      });

      await fetchGymFeatures(selectedGym.id);
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLimits = async () => {
    if (!selectedGym) return;

    try {
      // Find or create the limits override
      const limitsOverride = gymFeatures.find(
        (f) => f.custom_limits?.max_members !== undefined
      );

      const customLimits = {
        max_members: parseInt(maxMembers),
        max_staff: parseInt(maxStaff),
      };

      if (limitsOverride) {
        const { error } = await supabase
          .from('gym_feature_overrides')
          .update({ custom_limits: customLimits })
          .eq('id', limitsOverride.id);

        if (error) throw error;
      } else {
        // Create a new override for limits (using first feature as anchor)
        if (features.length > 0) {
          const { error } = await supabase
            .from('gym_feature_overrides')
            .insert([
              {
                gym_id: selectedGym.id,
                feature_id: features[0].id,
                is_enabled: true,
                custom_limits: customLimits,
              },
            ]);

          if (error) throw error;
        }
      }

      toast({
        title: 'Success',
        description: 'Limits updated.',
      });

      await fetchGymFeatures(selectedGym.id);
    } catch (error) {
      console.error('Error updating limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to update limits.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading gyms...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold">Gym Management</h1>
        </div>

        {/* Gyms List */}
        <Card>
          <CardHeader>
            <CardTitle>Gym Clients ({gyms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {gyms.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No gyms found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gyms.map((gym) => (
                      <TableRow key={gym.id}>
                        <TableCell className="font-medium">{gym.name}</TableCell>
                        <TableCell>{gym.email || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              gym.subscription_status === 'active'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {gym.subscription_status || 'trial'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectGym(gym)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage
                              </Button>
                            </DialogTrigger>
                            {selectedGym?.id === gym.id && (
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Manage {selectedGym.name}</DialogTitle>
                                </DialogHeader>

                                <Tabs defaultValue="features" className="w-full">
                                  <TabsList>
                                    <TabsTrigger value="features">Features</TabsTrigger>
                                    <TabsTrigger value="limits">Limits</TabsTrigger>
                                  </TabsList>

                                  {/* Features Tab */}
                                  <TabsContent value="features" className="space-y-4">
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                      {features.map((feature) => {
                                        const override = gymFeatures.find(
                                          (f) => f.feature_id === feature.id
                                        );
                                        const isEnabled = override?.is_enabled ?? false;

                                        return (
                                          <div
                                            key={feature.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                          >
                                            <div className="flex-1">
                                              <h4 className="font-semibold flex items-center gap-2">
                                                <Zap className="w-4 h-4" />
                                                {feature.name}
                                              </h4>
                                              <p className="text-sm text-muted-foreground">
                                                {feature.description}
                                              </p>
                                            </div>
                                            <Switch
                                              checked={isEnabled}
                                              onCheckedChange={() =>
                                                handleToggleFeature(feature.id, isEnabled)
                                              }
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </TabsContent>

                                  {/* Limits Tab */}
                                  <TabsContent value="limits" className="space-y-4">
                                    <div className="p-3 border rounded-lg bg-muted/50 flex items-start gap-2">
                                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                      <div className="text-sm">
                                        <p className="font-semibold">Usage Limits</p>
                                        <p className="text-muted-foreground">
                                          Set the maximum allowed resources for this gym.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="maxMembers">
                                          <Users className="w-4 h-4 inline mr-2" />
                                          Maximum Members
                                        </Label>
                                        <Input
                                          id="maxMembers"
                                          type="number"
                                          value={maxMembers}
                                          onChange={(e) => setMaxMembers(e.target.value)}
                                          placeholder="100"
                                          min="1"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="maxStaff">
                                          Maximum Staff Accounts
                                        </Label>
                                        <Input
                                          id="maxStaff"
                                          type="number"
                                          value={maxStaff}
                                          onChange={(e) => setMaxStaff(e.target.value)}
                                          placeholder="5"
                                          min="1"
                                        />
                                      </div>

                                      <Button
                                        onClick={handleUpdateLimits}
                                        className="w-full"
                                      >
                                        Update Limits
                                      </Button>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
