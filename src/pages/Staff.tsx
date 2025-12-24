import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RequirePermission } from '@/components/common/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, Users, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  gym_id: string | null;
  is_trainer: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  gym?: {
    name: string;
  };
}

interface Gym {
  id: string;
  name: string;
}

export default function Staff() {
  const { currentGym } = useGym();
  const { isSuperAdmin, isGymOwner, isAdmin, hasPermission, loading: rbacLoading } = useRBAC();
  
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff' as AppRole,
    gym_id: '',
    is_trainer: false,
  });

  const canManageStaff = hasPermission('staff:create') || hasPermission('staff:update');
  const canDeleteStaff = hasPermission('staff:delete');
  const canViewStaff = hasPermission('staff:read');

  useEffect(() => {
    if (!rbacLoading && canViewStaff) {
      fetchStaffMembers();
      if (isSuperAdmin) {
        fetchGyms();
      }
    } else if (!rbacLoading) {
      setLoading(false);
    }
  }, [rbacLoading, canViewStaff, isSuperAdmin, currentGym]);

  const fetchGyms = async () => {
    const { data } = await supabase.from('gyms').select('id, name').order('name');
    if (data) setGyms(data);
  };

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          gym_id,
          is_trainer,
          created_at
        `)
        .in('role', ['gym_owner', 'admin', 'staff']);

      // If not super admin, only show staff for current gym
      if (!isSuperAdmin && currentGym) {
        query = query.eq('gym_id', currentGym.id);
      }

      const { data: rolesData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff:', error);
        setLoading(false);
        return;
      }

      if (!rolesData || rolesData.length === 0) {
        setStaffMembers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles and gym names
      const userIds = [...new Set(rolesData.map(r => r.user_id))];
      const gymIds = [...new Set(rolesData.map(r => r.gym_id).filter((id): id is string => Boolean(id)))];

      const [profilesRes, gymsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        gymIds.length > 0 ? supabase.from('gyms').select('id, name').in('id', gymIds) : Promise.resolve({ data: [] as { id: string; name: string }[] })
      ]);

      const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const gymsMap = new Map((gymsRes.data || []).map(g => [g.id, g]));

      const enrichedStaff: StaffMember[] = rolesData.map(role => ({
        ...role,
        profile: profilesMap.get(role.user_id),
        gym: role.gym_id ? gymsMap.get(role.gym_id) : undefined,
      }));

      setStaffMembers(enrichedStaff);
    } catch (error) {
      console.error('Error in fetchStaffMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // First, find the user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.email)
      .maybeSingle();

    if (!profile) {
      toast.error('User not found. They must sign up first.');
      return;
    }

    const gymId = isSuperAdmin ? formData.gym_id : currentGym?.id;

    if (!gymId) {
      toast.error('Please select a gym');
      return;
    }

    // Check if role already exists
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', profile.id)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (existing && !selectedStaff) {
      toast.error('User already has a role in this gym');
      return;
    }

    if (selectedStaff) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: formData.role, is_trainer: formData.is_trainer })
        .eq('id', selectedStaff.id);

      if (error) {
        toast.error('Failed to update staff role');
        return;
      }
      toast.success('Staff role updated');
    } else {
      // Create new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          gym_id: gymId,
          role: formData.role,
          is_trainer: formData.is_trainer,
        });

      if (error) {
        toast.error('Failed to add staff member');
        return;
      }
      toast.success('Staff member added');
    }

    resetForm();
    fetchStaffMembers();
  };

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      email: staff.profile?.email || '',
      role: staff.role,
      gym_id: staff.gym_id || '',
      is_trainer: staff.is_trainer || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', selectedStaff.id);

    if (error) {
      toast.error('Failed to remove staff member');
      return;
    }

    toast.success('Staff member removed');
    setDeleteDialogOpen(false);
    setSelectedStaff(null);
    fetchStaffMembers();
  };

  const resetForm = () => {
    setFormData({ email: '', role: 'staff', gym_id: '', is_trainer: false });
    setSelectedStaff(null);
    setDialogOpen(false);
  };

  const getRoleBadge = (role: AppRole) => {
    const variants: Record<AppRole, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      super_admin: { variant: 'default', label: 'Super Admin' },
      gym_owner: { variant: 'default', label: 'Gym Owner' },
      manager: { variant: 'default', label: 'Manager' },
      admin: { variant: 'secondary', label: 'Admin' },
      coach: { variant: 'secondary', label: 'Coach' },
      trainer: { variant: 'secondary', label: 'Trainer' },
      instructor: { variant: 'secondary', label: 'Instructor' },
      physiotherapist: { variant: 'secondary', label: 'Physiotherapist' },
      nutritionist: { variant: 'secondary', label: 'Nutritionist' },
      receptionist: { variant: 'outline', label: 'Receptionist' },
      staff: { variant: 'outline', label: 'Staff' },
      member: { variant: 'outline', label: 'Member' },
    };
    const config = variants[role] || { variant: 'outline' as const, label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.gym?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || rbacLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canViewStaff) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Users className="w-12 h-12 mb-4" />
          <p>You don't have permission to view staff.</p>
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
            <h1 className="text-2xl font-display font-bold text-foreground">Trainers & Staff</h1>
            <p className="text-muted-foreground">
              {isSuperAdmin ? 'Manage trainers across all gyms' : `Manage trainers for ${currentGym?.name}`}
            </p>
          </div>
          {canManageStaff && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedStaff ? 'Edit Staff Role' : 'Add Staff Member'}</DialogTitle>
                <DialogDescription>
                  {selectedStaff ? 'Update the role for this staff member.' : 'Add a new staff member by their email address.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@example.com"
                    required
                    disabled={!!selectedStaff}
                  />
                </div>

                {isSuperAdmin && !selectedStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="gym">Gym</Label>
                    <Select
                      value={formData.gym_id}
                      onValueChange={(value) => setFormData({ ...formData, gym_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a gym" />
                      </SelectTrigger>
                      <SelectContent>
                        {gyms.map((gym) => (
                          <SelectItem key={gym.id} value={gym.id}>
                            {gym.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && <SelectItem value="gym_owner">Gym Owner</SelectItem>}
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_trainer" className="text-sm font-medium cursor-pointer">
                      Trainer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Grant training-specific permissions (classes, workouts, member progress)
                    </p>
                  </div>
                  <Switch
                    id="is_trainer"
                    checked={formData.is_trainer}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_trainer: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedStaff ? 'Update' : 'Add Staff'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Staff Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {isSuperAdmin && <TableHead>Gym</TableHead>}
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.profile?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{staff.profile?.email || '—'}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>{staff.gym?.name || '—'}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(staff.role)}
                        {staff.is_trainer && (
                          <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
                            <Dumbbell className="w-3 h-3 mr-1" />
                            Trainer
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(staff.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canManageStaff && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(staff)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteStaff && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedStaff?.profile?.full_name || 'this user'}'s role. 
              They will lose access to this gym's dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
