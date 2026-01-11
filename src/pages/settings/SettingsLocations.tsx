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
import { Plus, Pencil, Trash2, MapPin, Users, Building2, Loader2 } from 'lucide-react';
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
  { value: 'room', label: 'Sala de Treino' },
  { value: 'studio', label: 'Estúdio' },
  { value: 'outdoor', label: 'Área Exterior' },
  { value: 'pool', label: 'Piscina' },
  { value: 'gym_floor', label: 'Área de Musculação' },
  { value: 'other', label: 'Outro' },
];

interface FormErrors {
  name?: string;
  capacity?: string;
}

export default function SettingsLocations() {
  const { currentGym } = useGym();
  const { hasPermission } = useRBAC();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
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
      toast.error('Falha ao carregar locais');
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
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome não pode exceder 100 caracteres';
    }

    if (formData.capacity < 1 || formData.capacity > 1000) {
      newErrors.capacity = 'Capacidade deve estar entre 1 e 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym?.id) return;

    if (!validateForm()) {
      toast.error('Por favor corrija os erros antes de guardar');
      return;
    }

    setSaving(true);

    const locationData = {
      gym_id: currentGym.id,
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      description: formData.description.trim() || null,
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
        toast.error('Falha ao atualizar local');
        setSaving(false);
        return;
      }
      toast.success('Local atualizado com sucesso');
    } else {
      const { error } = await supabase
        .from('locations')
        .insert(locationData);

      if (error) {
        toast.error('Falha ao criar local');
        setSaving(false);
        return;
      }
      toast.success('Local criado com sucesso');
    }

    setSaving(false);
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
    setErrors({});
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', selectedLocation.id);

    if (error) {
      toast.error('Falha ao eliminar local. Pode estar a ser usado por aulas.');
      return;
    }

    toast.success('Local eliminado com sucesso');
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
      toast.error('Falha ao atualizar estado do local');
      return;
    }

    toast.success(location.is_active ? 'Local desativado' : 'Local ativado');
    fetchLocations();
  };

  const getTypeLabel = (type: string | null) => {
    return LOCATION_TYPES.find(t => t.value === type)?.label || type || 'Desconhecido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Locais</h2>
          <p className="text-sm text-muted-foreground">
            Gerir salas de treino, estúdios e outros espaços
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Local
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Ainda sem locais</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione o seu primeiro local para começar a agendar aulas
            </p>
            {canManage && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Local
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
                    <Badge variant="secondary">Inativo</Badge>
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
                  Capacidade: {location.capacity || 'Ilimitada'}
                </div>
                {location.floor_number !== null && location.floor_number > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Piso {location.floor_number}
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
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(location)}
                    >
                      {location.is_active ? 'Desativar' : 'Ativar'}
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
            <DialogTitle>{selectedLocation ? 'Editar Local' : 'Adicionar Local'}</DialogTitle>
            <DialogDescription>
              {selectedLocation ? 'Atualize os detalhes do local' : 'Adicione um novo local de treino'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sala de Treino Principal"
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
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
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                />
                {errors.capacity && (
                  <p className="text-xs text-destructive">{errors.capacity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Piso</Label>
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
              <Label htmlFor="address">Morada</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Edifício A, Rua Principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Equipado com colchões, espelhos e sistema de som..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Locais inativos não aparecem no agendamento
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  selectedLocation ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Local?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá eliminar permanentemente "{selectedLocation?.name}". As aulas associadas
              podem ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
