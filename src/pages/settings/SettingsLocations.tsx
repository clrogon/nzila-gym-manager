import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, MapPin, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  gym_id: string;
  name: string;
  address: string | null;
  description: string | null;
  capacity: number | null;
  type: string | null;
  floor_number: number | null;
  is_active: boolean;
  created_at: string;
}

const LOCATION_TYPES = [
  { value: 'room', label: 'Training Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'outdoor', label: 'Outdoor Area' },
  { value: 'pool', label: 'Pool' },
  { value: 'gym_floor', label: 'Gym Floor' },
  { value: 'other', label: 'Other' },
];

export default function SettingsLocations() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    capacity: 20,
    type: 'room',
    floor_number: 0,
    is_active: true,
  });

  const canManage = hasPermission('locations:create') || hasPermission('locations:update');
  const canDelete = hasPermission('locations:delete');

  useEffect(() => {
    if (currentGym?.id) {
      fetchLocations();
    }
  }, [currentGym?.id]);

  const fetchLocations = async () => {
    if (!currentGym?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('gym_id', currentGym.id)
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      capacity: 20,
      type: 'room',
      floor_number: 0,
      is_active: true,
    });
    setSelectedLocation(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym?.id) return;

    const locationData = {
      gym_id: currentGym.id,
      name: formData.name,
      address: formData.address || null,
      description: formData.description || null,
      capacity: formData.capacity,
      type: formData.type,
      floor_number: formData.floor_number || null,
      is_active: formData.is_active,
    };

    if (selectedLocation) {
      const { error } = await supabase
        .from('locations')
        .update(locationData)
        .eq('id', selectedLocation.id);

      if (error) {
        toast.error('Failed to update location');
        return;
      }
      toast.success('Location updated');
    } else {
      const { error } = await supabase
        .from('locations')
        .insert(locationData);

      if (error) {
        toast.error('Failed to create location');
        return;
      }
      toast.success('Location created');
    }

    resetForm();
    fetchLocations();
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      description: location.description || '',
      capacity: location.capacity || 20,
      type: location.type || 'room',
      floor_number: location.floor_number || 0,
      is_active: location.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', selectedLocation.id);

    if (error) {
      toast.error('Failed to delete location. It may be in use by classes.');
      return;
    }

    toast.success('Location deleted');
    setDeleteDialogOpen(false);
    setSelectedLocation(null);
    fetchLocations();
  };

  const toggleActive = async (location: Location) => {
    const { error } = await supabase
      .from('locations')
      .update({ is_active: !location.is_active })
      .eq('id', location.id);

    if (error) {
      toast.error('Failed to update location status');
      return;
    }

    toast.success(location.is_active ? 'Location deactivated' : 'Location activated');
    fetchLocations();
  };

  const getTypeLabel = (type: string | null) => {
    return LOCATION_TYPES.find(t => t.value === type)?.label || type || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Locations</h2>
          <p className="text-sm text-muted-foreground">
            Manage training rooms, studios, and other locations
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No locations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first location to start scheduling classes
            </p>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className={!location.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription>{getTypeLabel(location.type)}</CardDescription>
                  </div>
                  {!location.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {location.address}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Capacity: {location.capacity || 'Unlimited'}
                </div>
                {location.floor_number !== null && location.floor_number > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Floor {location.floor_number}
                  </div>
                )}
                {location.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {location.description}
                  </p>
                )}
                
                {canManage && (
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(location)}
                    >
                      {location.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedLocation(location);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
            <DialogDescription>
              {selectedLocation ? 'Update location details' : 'Add a new training location'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Training Room"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min={0}
                  value={formData.floor_number}
                  onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Building A, Street Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Equipped with mats, mirrors, and sound system..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive locations won't appear in scheduling
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedLocation ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedLocation?.name}". Classes using this location
              may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}