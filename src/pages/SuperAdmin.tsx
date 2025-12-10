import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus, Search, Edit, Trash2, Building2, Users, 
  ShieldCheck, TrendingUp, Globe 
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Gym {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  subscription_status: string | null;
  created_at: string;
  member_count?: number;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');

  useEffect(() => {
    checkSuperAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchGyms();
    }
  }, [isSuperAdmin]);

  const checkSuperAdminStatus = async () => {
    if (!user) {
      setIsSuperAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    setIsSuperAdmin(!!data && !error);
    if (!data) setLoading(false);
  };

  const fetchGyms = async () => {
    try {
      const { data: gymsData, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts for each gym
      const gymsWithCounts = await Promise.all(
        (gymsData || []).map(async (gym) => {
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('gym_id', gym.id);
          return { ...gym, member_count: count || 0 };
        })
      );

      setGyms(gymsWithCounts);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      toast({ title: 'Error', description: 'Failed to load gyms.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (gymName: string) => {
    return gymName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGym) {
        const { error } = await supabase
          .from('gyms')
          .update({
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            subscription_status: subscriptionStatus as any,
          })
          .eq('id', editingGym.id);

        if (error) throw error;
        toast({ title: 'Gym Updated', description: 'Gym details have been updated.' });
      } else {
        const { error } = await supabase
          .from('gyms')
          .insert([{
            name,
            slug: generateSlug(name),
            email: email || null,
            phone: phone || null,
            address: address || null,
            subscription_status: subscriptionStatus as any,
          }]);

        if (error) throw error;
        toast({ title: 'Gym Created', description: 'New gym has been added to the platform.' });
      }

      resetForm();
      setDialogOpen(false);
      fetchGyms();
    } catch (error) {
      console.error('Error saving gym:', error);
      toast({ title: 'Error', description: 'Failed to save gym.', variant: 'destructive' });
    }
  };

  const handleEdit = (gym: Gym) => {
    setEditingGym(gym);
    setName(gym.name);
    setEmail(gym.email || '');
    setPhone(gym.phone || '');
    setAddress(gym.address || '');
    setSubscriptionStatus(gym.subscription_status || 'trial');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('gyms').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Gym Deleted', description: 'Gym has been removed from the platform.' });
      fetchGyms();
    } catch (error) {
      console.error('Error deleting gym:', error);
      toast({ title: 'Error', description: 'Failed to delete gym.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingGym(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setSubscriptionStatus('trial');
  };

  const filteredGyms = gyms.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: gyms.length,
    active: gyms.filter((g) => g.subscription_status === 'active').length,
    trial: gyms.filter((g) => g.subscription_status === 'trial').length,
    totalMembers: gyms.reduce((sum, g) => sum + (g.member_count || 0), 0),
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'outline',
      past_due: 'destructive',
      cancelled: 'secondary',
      expired: 'destructive',
    };
    return <Badge variant={variants[status || 'trial'] || 'outline'}>{status || 'trial'}</Badge>;
  };

  // Check authorization
  if (isSuperAdmin === null) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Checking permissions...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-display font-bold">Super Admin</h1>
            </div>
            <p className="text-muted-foreground">Manage all gyms on the platform</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Gym
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGym ? 'Edit Gym' : 'Add New Gym'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="FitZone Gym"
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
                    placeholder="contact@gym.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+244 923 456 789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua da Samba, Luanda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Subscription Status</Label>
                  <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingGym ? 'Update Gym' : 'Create Gym'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Gyms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Globe className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.trial}</p>
                  <p className="text-xs text-muted-foreground">Trial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
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
                  placeholder="Search gyms by name, email, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gyms Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gym Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGyms.length > 0 ? (
                  filteredGyms.map((gym) => (
                    <TableRow key={gym.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{gym.name}</p>
                          <p className="text-xs text-muted-foreground">{gym.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{gym.email || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{gym.member_count || 0}</TableCell>
                      <TableCell>{getStatusBadge(gym.subscription_status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(gym)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Gym?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{gym.name}" and all its data including members, check-ins, and payments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(gym.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading gyms...' : 'No gyms found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
