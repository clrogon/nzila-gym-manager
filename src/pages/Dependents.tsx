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
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogTrigger 
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
  Shield, AlertTriangle, Save, X, Loader2 
} from 'lucide-react';

interface Dependent {
  id: string;
  full_name: string;
  date_of_birth: string;
  relationship: string;
  can_checkin_alone: boolean;
  emergency_contact: string;
  emergency_phone: string;
  photo_url: string;
  medical_notes: string;
  is_minor: boolean;
}

export default function Dependents() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [member, setMember] = useState<any>(null);
  const [dependents, setDependents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    relationship: 'son',
    can_checkin_alone: false,
    emergency_contact: '',
    emergency_phone: '',
    medical_notes: '',
    photo_url: ''
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
        .single();

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
      const { data } = await supabase
        .from('member_dependents')
        .select('*, dependent:members!dependent_member_id(*)')
        .eq('primary_member_id', memberId);

      setDependents(data || []);
    } catch (error) {
      console.error('Error fetching dependents:', error);
    }
  };

  const calculateAge = (dob: string) => {
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
      medical_notes: '',
      photo_url: ''
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (dep: any) => {
    setEditingId(dep.dependent.id);
    setFormData({
      full_name: dep.dependent.full_name,
      date_of_birth: dep.dependent.date_of_birth || '',
      relationship: dep.relationship,
      can_checkin_alone: dep.can_checkin_alone,
      emergency_contact: dep.emergency_contact || '',
      emergency_phone: dep.emergency_phone || '',
      medical_notes: dep.dependent.medical_notes || '',
      photo_url: dep.dependent.photo_url || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!member || !currentGym) return;
    if (!formData.full_name || !formData.date_of_birth) {
      toast.error('Nome e data de nascimento são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const age = calculateAge(formData.date_of_birth);

      if (editingId) {
        // Update existing dependent
        const { error: memberError } = await supabase
          .from('members')
          .update({
            full_name: formData.full_name,
            date_of_birth: formData.date_of_birth,
            medical_notes: formData.medical_notes || null,
            photo_url: formData.photo_url || null,
          })
          .eq('id', editingId);

        if (memberError) throw memberError;

        const { error: depError } = await supabase
          .from('member_dependents')
          .update({
            relationship: formData.relationship,
            can_checkin_alone: formData.can_checkin_alone,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null,
          })
          .eq('dependent_member_id', editingId)
          .eq('primary_member_id', member.id);

        if (depError) throw depError;

        toast.success('Dependente atualizado');
      } else {
        // Create new dependent member
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            gym_id: currentGym.id,
            full_name: formData.full_name,
            date_of_birth: formData.date_of_birth,
            medical_notes: formData.medical_notes || null,
            photo_url: formData.photo_url || null,
            is_dependent: true,
            status: 'active',
          })
          .select()
          .single();

        if (memberError) throw memberError;

        // Link as dependent
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
      setLoading(false);
    }
  };

  const handleDelete = async (depId: string, dependentMemberId: string) => {
    if (!member) return;

    setLoading(true);
    try {
      // Delete relationship
      const { error: depError } = await supabase
        .from('member_dependents')
        .delete()
        .eq('id', depId);

      if (depError) throw depError;

      // Optionally delete the member record if no other dependencies
      const { count } = await supabase
        .from('member_dependents')
        .select('*', { count: 'exact', head: true })
        .eq('dependent_member_id', dependentMemberId);

      if (count === 0) {
        await supabase
          .from('members')
          .delete()
          .eq('id', dependentMemberId);
      }

      toast.success('Dependente removido');
      await fetchDependents(member.id);
    } catch (error: any) {
      console.error('Error deleting dependent:', error);
      toast.error('Erro ao remover dependente');
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipLabel = (rel: string) => {
    const labels: Record<string, string> = {
      son: 'Filho',
      daughter: 'Filha',
      spouse: 'Cônjuge',
      sibling: 'Irmão/Irmã',
      parent: 'Pai/Mãe',
      other: 'Outro'
    };
    return labels[rel] || rel;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dependentes</h1>
            <p className="text-muted-foreground">
              Gerir familiares e dependentes associados à sua conta
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Dependente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Editar Dependente' : 'Adicionar Dependente'}
                </DialogTitle>
                <DialogDescription>
                  Adicione familiares à sua conta do ginásio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Data de Nascimento *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relação *</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(v) => setFormData({...formData, relationship: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="son">Filho</SelectItem>
                        <SelectItem value="daughter">Filha</SelectItem>
                        <SelectItem value="spouse">Cônjuge</SelectItem>
                        <SelectItem value="sibling">Irmão/Irmã</SelectItem>
                        <SelectItem value="parent">Pai/Mãe</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="can_checkin">Pode fazer check-in sozinho?</Label>
                    <p className="text-xs text-muted-foreground">
                      Permitir entrada sem supervisão de adulto
                    </p>
                  </div>
                  <Switch
                    id="can_checkin"
                    checked={formData.can_checkin_alone}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, can_checkin_alone: checked})
                    }
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Contacto de Emergência
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Nome</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      placeholder="Nome do contacto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Telefone</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      placeholder="+244 923 456 789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_notes">Notas Médicas</Label>
                  <textarea
                    id="medical_notes"
                    value={formData.medical_notes}
                    onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                    placeholder="Alergias, condições médicas, medicação..."
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Informação Importante</p>
                <p className="text-sm text-muted-foreground">
                  Dependentes menores de 18 anos devem ser sempre supervisionados por um adulto no ginásio, 
                  exceto se explicitamente autorizado. Mantenha as informações de contacto de emergência atualizadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {dependents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {dependents.map((dep) => {
              const age = dep.dependent.date_of_birth ? calculateAge(dep.dependent.date_of_birth) : null;
              const isMinor = age !== null && age < 18;

              return (
                <Card key={dep.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={dep.dependent.photo_url} />
                          <AvatarFallback>
                            {dep.dependent.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{dep.dependent.full_name}</CardTitle>
                          <CardDescription>{getRelationshipLabel(dep.relationship)}</CardDescription>
                        </div>
                      </div>
                      {isMinor && (
                        <Badge variant="outline">Menor</Badge>
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
                        <p className="font-medium">
                          {dep.can_checkin_alone ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>

                    {dep.emergency_contact && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Emergência</p>
                        <p className="text-sm font-medium">{dep.emergency_contact}</p>
                        <p className="text-xs text-muted-foreground">{dep.emergency_phone}</p>
                      </div>
                    )}

                    {dep.dependent.medical_notes && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notas Médicas</p>
                        <p className="text-sm">{dep.dependent.medical_notes}</p>
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
                            className="text-destructive hover:text-destructive"
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
                Adicione familiares à sua conta para gerir as suas subscrições
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Dependente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
