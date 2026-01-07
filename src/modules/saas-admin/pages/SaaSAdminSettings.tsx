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
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PlatformFeature {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_beta: boolean;
  created_at: string;
}

interface PlatformSetting {
  key: string;
  value: any;
  description: string | null;
}

export default function SaaSAdminSettings() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Feature form state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [featureCode, setFeatureCode] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureIsBeta, setFeatureIsBeta] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuresRes, settingsRes] = await Promise.all([
        supabase.from('platform_features').select('*'),
        supabase.from('platform_settings').select('*'),
      ]);

      if (featuresRes.error) throw featuresRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setFeatures(featuresRes.data || []);
      setSettings(settingsRes.data || []);

      // Extract maintenance mode settings
      const maintenanceSetting = settingsRes.data?.find(
        (s) => s.key === 'maintenance_mode'
      );
      if (maintenanceSetting?.value) {
        setMaintenanceMode(maintenanceSetting.value.enabled || false);
        setMaintenanceMessage(maintenanceSetting.value.message || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!featureName || !featureCode) {
      toast({
        title: 'Validation Error',
        description: 'Feature name and code are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingFeature) {
        const { error } = await supabase
          .from('platform_features')
          .update({
            name: featureName,
            code: featureCode,
            description: featureDescription || null,
            is_beta: featureIsBeta,
          })
          .eq('id', editingFeature.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Feature updated.' });
      } else {
        const { error } = await supabase.from('platform_features').insert([
          {
            name: featureName,
            code: featureCode,
            description: featureDescription || null,
            is_beta: featureIsBeta,
          },
        ]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Feature created.' });
      }

      resetFeatureForm();
      setFeatureDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feature.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from('platform_features')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Feature deleted.' });
      fetchData();
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feature.',
        variant: 'destructive',
      });
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          value: {
            enabled,
            message: maintenanceMessage,
          },
        })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      setMaintenanceMode(enabled);
      toast({
        title: 'Success',
        description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to update maintenance mode.',
        variant: 'destructive',
      });
    }
  };

  const resetFeatureForm = () => {
    setEditingFeature(null);
    setFeatureName('');
    setFeatureCode('');
    setFeatureDescription('');
    setFeatureIsBeta(false);
  };

  const handleEditFeature = (feature: PlatformFeature) => {
    setEditingFeature(feature);
    setFeatureName(feature.name);
    setFeatureCode(feature.code);
    setFeatureDescription(feature.description || '');
    setFeatureIsBeta(feature.is_beta);
    setFeatureDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold">Platform Settings</h1>
        </div>

        <Tabs defaultValue="features" className="w-full">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Platform Features</h2>
              <Dialog open={featureDialogOpen} onOpenChange={(open) => {
                setFeatureDialogOpen(open);
                if (!open) resetFeatureForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFeature ? 'Edit Feature' : 'Add New Feature'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFeatureSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="featureName">Feature Name *</Label>
                      <Input
                        id="featureName"
                        value={featureName}
                        onChange={(e) => setFeatureName(e.target.value)}
                        placeholder="Advanced Analytics"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="featureCode">Feature Code *</Label>
                      <Input
                        id="featureCode"
                        value={featureCode}
                        onChange={(e) =>
                          setFeatureCode(e.target.value.toUpperCase())
                        }
                        placeholder="ADV_ANALYTICS"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="featureDescription">Description</Label>
                      <Input
                        id="featureDescription"
                        value={featureDescription}
                        onChange={(e) => setFeatureDescription(e.target.value)}
                        placeholder="Feature description..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featureIsBeta"
                        checked={featureIsBeta}
                        onCheckedChange={setFeatureIsBeta}
                      />
                      <Label htmlFor="featureIsBeta">Beta Feature</Label>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingFeature ? 'Update Feature' : 'Create Feature'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                {features.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No features defined.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {features.map((feature) => (
                          <TableRow key={feature.id}>
                            <TableCell className="font-medium">
                              {feature.name}
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {feature.code}
                              </code>
                            </TableCell>
                            <TableCell>{feature.description || '-'}</TableCell>
                            <TableCell>
                              {feature.is_beta && (
                                <Badge variant="outline">Beta</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFeature(feature)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFeature(feature.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Enable Maintenance Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, all users will see a maintenance notice.
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>

                {maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">
                      Maintenance Message
                    </Label>
                    <Input
                      id="maintenanceMessage"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="System is undergoing maintenance..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Default Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        These settings are applied to newly created gym accounts.
                      </p>
                    </div>
                  </div>
                </div>

                {settings
                  .filter((s) => s.key === 'default_gym_settings')
                  .map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <Label>Default Currency</Label>
                      <Input
                        value={setting.value?.currency || 'USD'}
                        disabled
                        className="bg-muted"
                      />
                      <Label>Default Timezone</Label>
                      <Input
                        value={setting.value?.timezone || 'UTC'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
