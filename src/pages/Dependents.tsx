import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, Plus, Trash2, Edit, UserPlus, 
  AlertTriangle, Save, X, Loader2, Phone
} from 'lucide-react';

interface DependentRelation {
  id: string;
  relationship: string;
  can_checkin_alone: boolean;
  emergency_contact: string | null;
  emergency_phone: string | null;
  dependent: {
    id: string;
    full_name: string;
    date_of_birth: string | null;
    photo_url: string | null;
    health_conditions: string | null;
  };
}

const RELATIONSHIPS = [
  { value: 'son', label: 'Filho' },
  { value: 'daughter', label: 'Filha' },
  { value: 'spouse', label: 'Cônjuge' },
  { value: 'sibling', label: 'Irmão/Irmã' },
  { value: 'parent', label: 'Pai/Mãe' },
  { value: 'other', label: 'Outro' }
];

export default function Dependents() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [member, setMember] = useState<any>(null);
  const [dependents, setDependents] = useState<DependentRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    relationship: 'son',
    can_checkin_alone: false,
    emergency_contact: '',
    emergency_phone: '',
    health_conditions: ''
  });

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberData();
    }
  }, [user, currentGym]);

  const fetchMemberData = async () => {
    if (!user || !currentGym) return;

    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);
        await fetchDependents(memberData.id);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependents = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('member_dependents')
        .select(`
          id,
          relationship,
          can_checkin_alone,
          emergency_contact,
          emergency_phone,
          dependent:members!dependent_member_id (
            id,
            full_name,
            date_of_birth,
            photo_url,
            health_conditions
          )
        `)
        .eq('primary_member_id', memberId);

      if (error) throw error;
      setDependents((data as unknown as DependentRelation[]) || []);
    } catch (error) {
      console.error('Error fetching dependents:', error);
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      date_of_birth: '',
      relationship: 'son',
      can_checkin_alone: false,
      emergency_contact: '',
      emergency_phone: '',
      health_conditions: ''
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (dep: DependentRelation) => {
    setEditingId(dep.id);
    setFormData({
      full_name: dep.dependent.full_name,
      date_of_birth: dep.dependent.date_of_birth || '',
      relationship: dep.relationship,
      can_checkin_alone: dep.can_checkin_alone,
      emergency_contact: dep.emergency_contact || '',
      emergency_phone: dep.emergency_phone || '',
      health_conditions: dep.dependent.health_conditions || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!member || !currentGym) return;
    if (!formData.full_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Find the dependent relation to get the dependent member id
        const relation = dependents.find(d => d.id === editingId);
        if (!relation) throw new Error('Dependente não encontrado');

        // Update member record
        const { error: memberError } = await supabase
          .from('members')
          .update({
            full_name: formData.full_name,
            date_of_birth: formData.date_of_birth || null,
            health_conditions: formData.health_conditions || null,
          })
          .eq('id', relation.dependent.id);

        if (memberError) throw memberError;

        // Update relationship
        const { error: depError } = await supabase
          .from('member_dependents')
          .update({
            relationship: formData.relationship,
            can_checkin_alone: formData.can_checkin_alone,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null,
          })
          .eq('id', editingId);

        if (depError) throw depError;

        toast.success('Dependente atualizado');
      } else {
        // Create new dependent member
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            gym_id: currentGym.id,
            full_name: formData.full_name,
            date_of_birth: formData.date_of_birth || null,
            health_conditions: formData.health_conditions || null,
            is_dependent: true,
            status: 'active',
          })
          .select()
          .single();

        if (memberError) throw memberError;

        // Create relationship
        const { error: depError } = await supabase
          .from('member_dependents')
          .insert({
            primary_member_id: member.id,
            dependent_member_id: newMember.id,
            relationship: formData.relationship,
            can_checkin_alone: formData.can_checkin_alone,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null,
          });

        if (depError) throw depError;

        toast.success('Dependente adicionado');
      }

      resetForm();
      await fetchDependents(member.id);
    } catch (error: any) {
      console.error('Error saving dependent:', error);
      toast.error('Erro ao guardar dependente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (depId: string, dependentMemberId: string) => {
    if (!member) return;

    setSaving(true);
    try {
      // Delete relationship first
      const { error: depError } = await supabase
        .from('member_dependents')
        .delete()
        .eq('id', depId);

      if (depError) throw depError;

      // Check if dependent has other relationships
      const { count } = await supabase
        .from('member_dependents')
        .select('*', { count: 'exact', head: true })
        .eq('dependent_member_id', dependentMemberId);

      // Delete member if no other relationships exist
      if (count === 0) {
        await supabase
          .from('members')
          .delete()
          .eq('id', dependentMemberId)
          .eq('is_dependent', true);
      }

      toast.success('Dependente removido');
      await fetchDependents(member.id);
    } catch (error: any) {
      console.error('Error deleting dependent:', error);
      toast.error('Erro ao remover dependente');
    } finally {
      setSaving(false);
    }
  };

  const getRelationshipLabel = (rel: string) => {
    const found = RELATIONSHIPS.find(r => r.value === rel);
    return found?.label || rel;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!member) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-medium mb-2">Sem Acesso</h3>
            <p className="text-muted-foreground">
              Não foi encontrado um registo de membro associado à sua conta.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dependentes</h1>
              <p className="text-muted-foreground">
                Gerir familiares vinculados à sua conta
              </p>
            </div>
          </div>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Dependente
          </Button>
        </div>

        {/* Info Alert */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Informação Importante</p>
                <p className="text-sm text-muted-foreground">
                  Dependentes menores de 18 anos devem ser supervisionados por um adulto, 
                  exceto se explicitamente autorizado. Mantenha os contactos de emergência atualizados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dependents List */}
        {dependents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {dependents.map((dep) => {
              const age = calculateAge(dep.dependent.date_of_birth);
              const isMinor = age !== null && age < 18;

              return (
                <Card key={dep.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={dep.dependent.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10">
                            {getInitials(dep.dependent.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{dep.dependent.full_name}</CardTitle>
                          <CardDescription>{getRelationshipLabel(dep.relationship)}</CardDescription>
                        </div>
                      </div>
                      {isMinor && (
                        <Badge variant="outline" className="text-xs">Menor</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {age !== null && (
                        <div>
                          <p className="text-muted-foreground">Idade</p>
                          <p className="font-medium">{age} anos</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Check-in Solo</p>
                        <p className="font-medium">{dep.can_checkin_alone ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>

                    {dep.emergency_contact && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Contacto de Emergência</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{dep.emergency_contact}</span>
                          {dep.emergency_phone && (
                            <span className="text-sm text-muted-foreground">• {dep.emergency_phone}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {dep.dependent.health_conditions && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notas Médicas</p>
                        <p className="text-sm">{dep.dependent.health_conditions}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(dep)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Dependente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem a certeza que deseja remover {dep.dependent.full_name} da sua conta?
                              Esta ação não pode ser revertida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(dep.id, dep.dependent.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Sem Dependentes</h3>
              <p className="text-muted-foreground mb-4">
                Adicione familiares à sua conta para gerir as suas inscrições
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Dependente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Dependente' : 'Adicionar Dependente'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'Atualize as informações do dependente' : 'Adicione um familiar à sua conta'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dep-name">Nome Completo *</Label>
                <Input
                  id="dep-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Nome do dependente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dep-dob">Data de Nascimento</Label>
                  <Input
                    id="dep-dob"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Relação *</Label>
                  <Select 
                    value={formData.relationship} 
                    onValueChange={(v) => setFormData({...formData, relationship: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Pode fazer check-in sozinho?</p>
                  <p className="text-xs text-muted-foreground">
                    Permitir entrada sem supervisão de adulto
                  </p>
                </div>
                <Switch
                  checked={formData.can_checkin_alone}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, can_checkin_alone: checked})
                  }
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Contacto de Emergência</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dep-ec-name">Nome</Label>
                    <Input
                      id="dep-ec-name"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dep-ec-phone">Telefone</Label>
                    <Input
                      id="dep-ec-phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      placeholder="+244 923..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dep-health">Notas Médicas</Label>
                <Textarea
                  id="dep-health"
                  value={formData.health_conditions}
                  onChange={(e) => setFormData({...formData, health_conditions: e.target.value})}
                  placeholder="Alergias, condições médicas, medicação..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} className="flex-1" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}