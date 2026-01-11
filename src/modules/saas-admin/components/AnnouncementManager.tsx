import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Megaphone,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  Bell,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'critical' | 'maintenance';
  target_audience: 'all' | 'gym_owners' | 'active_subscribers';
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AnnouncementManager() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');
  const [audience, setAudience] = useState<Announcement['target_audience']>('all');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({ title: 'Error', description: 'Failed to load announcements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title,
        content,
        type,
        target_audience: audience,
        starts_at: startsAt || new Date().toISOString(),
        ends_at: endsAt || null,
        is_active: isActive,
      };

      if (editing) {
        const { error } = await supabase
          .from('platform_announcements')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Announcement updated' });
      } else {
        const { error } = await supabase
          .from('platform_announcements')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Announcement created' });
      }

      resetForm();
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({ title: 'Error', description: 'Failed to save announcement', variant: 'destructive' });
    }
  };

  const handleEdit = (a: Announcement) => {
    setEditing(a);
    setTitle(a.title);
    setContent(a.content);
    setType(a.type);
    setAudience(a.target_audience);
    setStartsAt(a.starts_at?.slice(0, 16) || '');
    setEndsAt(a.ends_at?.slice(0, 16) || '');
    setIsActive(a.is_active);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('platform_announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Announcement deleted' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ title: 'Error', description: 'Failed to delete announcement', variant: 'destructive' });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('platform_announcements')
        .update({ is_active: !current })
        .eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setType('info');
    setAudience('all');
    setStartsAt('');
    setEndsAt('');
    setIsActive(true);
  };

  const getTypeIcon = (t: string) => {
    const icons: Record<string, React.ReactNode> = {
      info: <Info className="h-4 w-4 text-blue-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      critical: <Bell className="h-4 w-4 text-red-500" />,
      maintenance: <Wrench className="h-4 w-4 text-orange-500" />,
    };
    return icons[t] || icons.info;
  };

  const getTypeBadge = (t: string) => {
    const styles: Record<string, string> = {
      info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      critical: 'bg-red-500/10 text-red-600 border-red-500/20',
      maintenance: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    };
    return <Badge className={styles[t]}>{t}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-amber-500" />
            Platform Announcements
          </h2>
          <p className="text-muted-foreground">Communicate with gym owners across the platform</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Announcement['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v as Announcement['target_audience'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="gym_owners">Gym Owners</SelectItem>
                      <SelectItem value="active_subscribers">Active Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editing ? 'Update' : 'Create'} Announcement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className={`border-l-4 ${a.is_active ? 'border-l-amber-500' : 'border-l-muted opacity-60'}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(a.type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{a.title}</h3>
                        {getTypeBadge(a.type)}
                        <Badge variant="outline">{a.target_audience}</Badge>
                        {!a.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Starts: {format(new Date(a.starts_at), 'MMM dd, yyyy HH:mm')}
                        {a.ends_at && ` • Ends: ${format(new Date(a.ends_at), 'MMM dd, yyyy HH:mm')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={a.is_active}
                      onCheckedChange={() => toggleActive(a.id, a.is_active)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
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
                          <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(a.id)}
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
