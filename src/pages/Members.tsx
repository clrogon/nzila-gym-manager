import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Clock, 
  ShieldAlert, Mail, Phone, MapPin, Calendar, CreditCard, 
  Activity, MoreHorizontal, Eye, AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  photo_url: string | null;
  notes: string | null;
  membership_plan_id: string | null;
  membership_start_date: string | null;
  membership_end_date: string | null;
  created_at: string;
  is_dependent: boolean | null;
  tutor_id: string | null;
  health_conditions: string | null;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

export default function Members() {
  const { currentGym } = useGym();
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Form state - Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Form state - Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Form state - Membership
  const [status, setStatus] = useState<string>('active');
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [membershipStartDate, setMembershipStartDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Form state - Dependent
  const [isDependent, setIsDependent] = useState(false);
  const [tutorId, setTutorId] = useState('');
  const [healthConditions, setHealthConditions] = useState('');

  const canViewMembers = hasPermission('members:read');
  const canCreateMembers = hasPermission('members:create');
  const canUpdateMembers = hasPermission('members:update');
  const canDeleteMembers = hasPermission('members:delete');

  useEffect(() => {
    if (currentGym && !rbacLoading && canViewMembers) {
      fetchMembers();
      fetchPlans();
    } else if (!rbacLoading) {
      setLoading(false);
    }
  }, [currentGym, rbacLoading, canViewMembers]);

  const fetchMembers = async () => {
    if (!currentGym) return;
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (!currentGym) return;

    const { data } = await supabase
      .from('membership_plans')
      .select('id, name, price, duration_days')
      .eq('gym_id', currentGym.id)
      .eq('is_active', true)
      .order('price');

    setPlans(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGym) {
      toast({ title: 'Erro', description: 'Por favor crie um ginásio primeiro.', variant: 'destructive' });
      return;
    }

    let endDate = null;
    if (membershipPlanId && membershipStartDate) {
      const plan = plans.find(p => p.id === membershipPlanId);
      if (plan) {
        const start = new Date(membershipStartDate);
        start.setDate(start.getDate() + plan.duration_days);
        endDate = start.toISOString().split('T')[0];
      }
    }

    const memberData = {
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      address: address || null,
      photo_url: photoUrl || null,
      emergency_contact: emergencyContact || null,
      emergency_phone: emergencyPhone || null,
      status: status as 'active' | 'inactive' | 'pending' | 'suspended',
      membership_plan_id: membershipPlanId || null,
      membership_start_date: membershipStartDate || null,
      membership_end_date: endDate,
      notes: notes || null,
      is_dependent: isDependent,
      tutor_id: isDependent && tutorId ? tutorId : null,
      health_conditions: healthConditions || null,
    };

    try {
      if (editingMember) {
        const { error } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', editingMember.id);

        if (error) throw error;
        toast({ title: 'Membro Atualizado', description: 'Os detalhes do membro foram atualizados.' });
      } else {
        const { error } = await supabase
          .from('members')
          .insert([{ ...memberData, gym_id: currentGym.id }]);

        if (error) throw error;
        toast({ title: 'Membro Adicionado', description: 'Novo membro foi registado.' });
      }

      resetForm();
      setDialogOpen(false);
      fetchMembers();
    } catch (error) {
      console.error('Erro ao guardar membro:', error);
      toast({ title: 'Erro', description: 'Falha ao guardar membro.', variant: 'destructive' });
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFullName(member.full_name);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setDateOfBirth(member.date_of_birth || '');
    setAddress(member.address || '');
    setPhotoUrl(member.photo_url || '');
    setEmergencyContact(member.emergency_contact || '');
    setEmergencyPhone(member.emergency_phone || '');
    setStatus(member.status);
    setMembershipPlanId(member.membership_plan_id || '');
    setMembershipStartDate(member.membership_start_date || '');
    setNotes(member.notes || '');
    setIsDependent(member.is_dependent || false);
    setTutorId(member.tutor_id || '');
    setHealthConditions(member.health_conditions || '');
    setDialogOpen(true);
  };

  const handleViewDetails = (member: Member) => {
    setViewingMember(member);
    setDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este membro? Esta ação não pode ser revertida.')) return;

    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Membro Eliminado' });
      fetchMembers();
    } catch (error) {
      console.error('Erro ao eliminar membro:', error);
      toast({ title: 'Erro', description: 'Falha ao eliminar membro.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setPhotoUrl('');
    setEmergencyContact('');
    setEmergencyPhone('');
    setStatus('active');
    setMembershipPlanId('');
    setMembershipStartDate('');
    setNotes('');
    setIsDependent(false);
    setTutorId('');
    setHealthConditions('');
  };

  // Get potential tutors (non-dependent members)
  const potentialTutors = members.filter(m => !m.is_dependent && m.id !== editingMember?.id);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
    pending: members.filter((m) => m.status === 'pending').length,
    expiringSoon: members.filter((m) => {
      if (!m.membership_end_date) return false;
      const endDate = new Date(m.membership_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    }).length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      pending: 'outline',
    };
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      pending: 'Pendente',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMembershipStatus = (member: Member) => {
    if (!member.membership_end_date) return null;
    const endDate = new Date(member.membership_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'text-destructive' };
    if (daysUntilExpiry <= 7) return { status: 'expiring', days: daysUntilExpiry, color: 'text-yellow-600' };
    return { status: 'active', days: daysUntilExpiry, color: 'text-green-600' };
  };

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Nenhum Ginásio Selecionado</h2>
          <p className="text-muted-foreground mb-4">Crie ou selecione um ginásio para gerir membros.</p>
          <Button onClick={() => window.location.href = '/onboarding'}>
            Criar o Seu Ginásio
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!rbacLoading && !canViewMembers) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Não tem permissão para ver membros.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Membros</h1>
            <p className="text-muted-foreground">Gerir os membros do ginásio</p>
          </div>

          {canCreateMembers && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMember ? 'Editar Membro' : 'Registar Novo Membro'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="emergency">Emergência</TabsTrigger>
                      <TabsTrigger value="membership">Subscrição</TabsTrigger>
                      <TabsTrigger value="dependent">Dependente</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Nome Completo *</Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="João Silva"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joao@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+244 923 456 789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Morada</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rua, Cidade, Província"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photoUrl">URL da Foto</Label>
                        <Input
                          id="photoUrl"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="emergency" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">Nome do Contacto de Emergência</Label>
                          <Input
                            id="emergencyContact"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Nome do contacto"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                          <Input
                            id="emergencyPhone"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="+244 923 456 789"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="membership" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="status">Estado</Label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="suspended">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan">Plano de Subscrição</Label>
                          <Select value={membershipPlanId} onValueChange={setMembershipPlanId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} - {plan.duration_days} dias
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Data de Início da Subscrição</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={membershipStartDate}
                            onChange={(e) => setMembershipStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notas adicionais sobre este membro..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="dependent" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="isDependent">É Dependente / Menor?</Label>
                          <p className="text-sm text-muted-foreground">
                            Ative se este membro é filho/a ou dependente de outro membro
                          </p>
                        </div>
                        <Switch
                          id="isDependent"
                          checked={isDependent}
                          onCheckedChange={setIsDependent}
                        />
                      </div>

                      {isDependent && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-2">
                            <Label htmlFor="tutorId">Responsável / Tutor *</Label>
                            <Select value={tutorId} onValueChange={setTutorId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar o responsável" />
                              </SelectTrigger>
                              <SelectContent>
                                {potentialTutors.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              A faturação será consolidada na conta do responsável
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="healthConditions">Condições de Saúde / Notas Médicas</Label>
                            <Textarea
                              id="healthConditions"
                              value={healthConditions}
                              onChange={(e) => setHealthConditions(e.target.value)}
                              placeholder="Alergias, condições médicas, medicação..."
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button type="submit" className="w-full">
                    {editingMember ? 'Atualizar Membro' : 'Registar Membro'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <UserX className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-muted-foreground">A Expirar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, email ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filtrar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell">Subscrição</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const membershipStatus = getMembershipStatus(member);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.photo_url || undefined} />
                              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                {member.email || member.phone || '-'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {member.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {member.phone}
                              </div>
                            )}
                            {!member.email && !member.phone && '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {membershipStatus ? (
                            <div className={membershipStatus.color}>
                              <p className="text-sm font-medium">
                                {membershipStatus.status === 'expired' 
                                  ? `Expirou há ${membershipStatus.days} dias`
                                  : membershipStatus.status === 'expiring'
                                  ? `Expira em ${membershipStatus.days} dias`
                                  : `${membershipStatus.days} dias restantes`
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Até {formatDate(member.membership_end_date)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(member)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {canUpdateMembers && (
                                <DropdownMenuItem onClick={() => handleEdit(member)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDeleteMembers && (
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => handleDelete(member.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'A carregar...' : 'Nenhum membro encontrado. Adicione o seu primeiro membro!'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Member Details Sheet */}
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            {viewingMember && (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={viewingMember.photo_url || undefined} />
                      <AvatarFallback className="text-xl">{getInitials(viewingMember.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle>{viewingMember.full_name}</SheetTitle>
                      <SheetDescription>{getStatusBadge(viewingMember.status)}</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Informação de Contacto</h4>
                    <div className="space-y-3">
                      {viewingMember.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{viewingMember.email}</span>
                        </div>
                      )}
                      {viewingMember.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{viewingMember.phone}</span>
                        </div>
                      )}
                      {viewingMember.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{viewingMember.address}</span>
                        </div>
                      )}
                      {viewingMember.date_of_birth && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDate(viewingMember.date_of_birth)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Subscrição</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {viewingMember.membership_plan_id 
                            ? plans.find(p => p.id === viewingMember.membership_plan_id)?.name || 'Plano Desconhecido'
                            : 'Sem plano atribuído'
                          }
                        </span>
                      </div>
                      {viewingMember.membership_start_date && (
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span>Início: {formatDate(viewingMember.membership_start_date)}</span>
                        </div>
                      )}
                      {viewingMember.membership_end_date && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Expira: {formatDate(viewingMember.membership_end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(viewingMember.emergency_contact || viewingMember.emergency_phone) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Contacto de Emergência</h4>
                        <div className="space-y-2">
                          {viewingMember.emergency_contact && (
                            <p>{viewingMember.emergency_contact}</p>
                          )}
                          {viewingMember.emergency_phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{viewingMember.emergency_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {viewingMember.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Notas</h4>
                        <p className="text-sm">{viewingMember.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    {canUpdateMembers && (
                      <Button 
                        className="flex-1" 
                        onClick={() => {
                          setDetailsOpen(false);
                          handleEdit(viewingMember);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Membro
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
