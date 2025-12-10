import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Phone, Mail, DollarSign, User, ArrowRight, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type LeadSource = 'walk_in' | 'instagram' | 'facebook' | 'referral' | 'website' | 'other';

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  estimated_value: number;
  created_at: string;
};

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'bg-blue-500' },
  { status: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { status: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { status: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { status: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { status: 'won', label: 'Won', color: 'bg-green-500' },
  { status: 'lost', label: 'Lost', color: 'bg-destructive' },
];

const SOURCE_LABELS: Record<LeadSource, string> = {
  walk_in: 'Walk-in',
  instagram: 'Instagram',
  facebook: 'Facebook',
  referral: 'Referral',
  website: 'Website',
  other: 'Other',
};

export function LeadsKanban() {
  const { currentGym } = useGym();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!currentGym?.id,
  });

  const createLead = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('leads').insert({
        gym_id: currentGym!.id,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || 'walk_in',
        status: 'new',
        notes: data.notes || null,
        estimated_value: parseFloat(data.estimated_value) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created');
      setIsOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to create lead'),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from('leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated');
    },
  });

  const convertToMember = useMutation({
    mutationFn: async (lead: Lead) => {
      // Create member from lead
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          gym_id: currentGym!.id,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          status: 'pending',
        })
        .select()
        .single();
      if (memberError) throw memberError;

      // Update lead as converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: 'won', 
          converted_member_id: member.id,
          converted_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Lead converted to member');
      setSelectedLead(null);
    },
    onError: () => toast.error('Failed to convert lead'),
  });

  const getLeadsByStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  const stats = {
    total: leads.length,
    pipelineValue: leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0,
  };

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Sales CRM</h1>
          <p className="text-muted-foreground">Manage leads and track conversions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((data) => createLead.mutate(data))} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input {...register('full_name', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source</Label>
                  <Select onValueChange={(v) => setValue('source', v)} defaultValue="walk_in">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Value</Label>
                  <Input type="number" {...register('estimated_value')} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea {...register('notes')} />
              </div>
              <Button type="submit" className="w-full" disabled={createLead.isPending}>
                Create Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{stats.pipelineValue.toLocaleString()} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <ArrowRight className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((column) => (
            <div key={column.status} className="w-72 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-medium">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {getLeadsByStatus(column.status).length}
                </Badge>
              </div>
              <div className="space-y-3 min-h-[200px] p-2 bg-muted/30 rounded-lg">
                {getLeadsByStatus(column.status).map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{lead.full_name}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline">{SOURCE_LABELS[lead.source]}</Badge>
                        {lead.estimated_value > 0 && (
                          <span className="text-xs font-medium text-green-600">
                            {lead.estimated_value.toLocaleString()} AOA
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLead?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{selectedLead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{selectedLead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p>{SOURCE_LABELS[selectedLead.source]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p>{selectedLead.estimated_value.toLocaleString()} AOA</p>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}
              <div>
                <Label>Move to Stage</Label>
                <Select 
                  value={selectedLead.status}
                  onValueChange={(v) => {
                    updateLeadStatus.mutate({ id: selectedLead.id, status: v as LeadStatus });
                    setSelectedLead({ ...selectedLead, status: v as LeadStatus });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.status} value={col.status}>{col.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!['won', 'lost'].includes(selectedLead.status) && (
                <Button 
                  className="w-full gap-2" 
                  onClick={() => convertToMember.mutate(selectedLead)}
                  disabled={convertToMember.isPending}
                >
                  <UserPlus className="w-4 h-4" />
                  Convert to Member
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
