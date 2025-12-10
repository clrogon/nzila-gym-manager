import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, Award, Loader2, ChevronRight, User, Search,
  Medal, TrendingUp, History
} from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  email: string | null;
}

interface Discipline {
  id: string;
  name: string;
  category: string | null;
}

interface DisciplineRank {
  id: string;
  discipline_id?: string;
  name: string;
  level: number;
  color: string | null;
}

interface MemberRank {
  id: string;
  member_id: string;
  discipline_id: string;
  rank_id: string;
  awarded_at: string;
  notes: string | null;
  member?: Member;
  discipline?: Discipline;
  rank?: DisciplineRank;
}

interface RankPromotion {
  id: string;
  member_id: string;
  discipline_id: string;
  from_rank_id: string | null;
  to_rank_id: string;
  promoted_by: string | null;
  promotion_date: string;
  notes: string | null;
  member?: Member;
  discipline?: Discipline;
  from_rank?: DisciplineRank;
  to_rank?: DisciplineRank;
}

export function RankPromotion() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [memberRanks, setMemberRanks] = useState<MemberRank[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<RankPromotion[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [ranks, setRanks] = useState<DisciplineRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    member_id: '',
    discipline_id: '',
    to_rank_id: '',
    notes: '',
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchData();
    }
  }, [currentGym?.id]);

  useEffect(() => {
    if (formData.discipline_id) {
      fetchRanksForDiscipline(formData.discipline_id);
    }
  }, [formData.discipline_id]);

  const fetchData = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const [membersRes, disciplinesRes, memberRanksRes, promotionsRes] = await Promise.all([
        supabase
          .from('members')
          .select('id, full_name, email')
          .eq('gym_id', currentGym.id)
          .eq('status', 'active')
          .order('full_name'),
        supabase
          .from('disciplines')
          .select('id, name, category')
          .eq('gym_id', currentGym.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('member_ranks')
          .select(`
            *,
            member:members(id, full_name, email),
            discipline:disciplines(id, name, category),
            rank:discipline_ranks(id, name, level, color)
          `)
          .order('awarded_at', { ascending: false }),
        supabase
          .from('rank_promotions')
          .select(`
            *,
            member:members(id, full_name, email),
            discipline:disciplines(id, name, category),
            from_rank:discipline_ranks!rank_promotions_from_rank_id_fkey(id, name, level, color),
            to_rank:discipline_ranks!rank_promotions_to_rank_id_fkey(id, name, level, color)
          `)
          .order('promotion_date', { ascending: false })
          .limit(50),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (disciplinesRes.error) throw disciplinesRes.error;
      if (memberRanksRes.error) throw memberRanksRes.error;
      if (promotionsRes.error) throw promotionsRes.error;

      setMembers(membersRes.data || []);
      setDisciplines(disciplinesRes.data || []);
      setMemberRanks(memberRanksRes.data || []);
      setPromotionHistory(promotionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanksForDiscipline = async (disciplineId: string) => {
    try {
      const { data, error } = await supabase
        .from('discipline_ranks')
        .select('*')
        .eq('discipline_id', disciplineId)
        .order('level', { ascending: true });

      if (error) throw error;
      setRanks(data || []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const getCurrentRank = (memberId: string, disciplineId: string) => {
    return memberRanks.find(
      (mr) => mr.member_id === memberId && mr.discipline_id === disciplineId
    );
  };

  const handlePromote = async () => {
    if (!formData.member_id || !formData.discipline_id || !formData.to_rank_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentRank = getCurrentRank(formData.member_id, formData.discipline_id);

      // Create promotion record
      const { error: promotionError } = await supabase.from('rank_promotions').insert({
        member_id: formData.member_id,
        discipline_id: formData.discipline_id,
        from_rank_id: currentRank?.rank_id || null,
        to_rank_id: formData.to_rank_id,
        promoted_by: user?.id,
        notes: formData.notes || null,
      });

      if (promotionError) throw promotionError;

      // Update or insert member_ranks
      if (currentRank) {
        const { error } = await supabase
          .from('member_ranks')
          .update({
            rank_id: formData.to_rank_id,
            awarded_at: new Date().toISOString(),
            awarded_by: user?.id,
            notes: formData.notes || null,
          })
          .eq('id', currentRank.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('member_ranks').insert({
          member_id: formData.member_id,
          discipline_id: formData.discipline_id,
          rank_id: formData.to_rank_id,
          awarded_by: user?.id,
          notes: formData.notes || null,
        });

        if (error) throw error;
      }

      toast.success('Member promoted successfully!');
      setIsPromoteDialogOpen(false);
      setFormData({ member_id: '', discipline_id: '', to_rank_id: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to promote member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMemberRanks = memberRanks.filter((mr) => {
    const memberName = mr.member?.full_name?.toLowerCase() || '';
    const disciplineName = mr.discipline?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return memberName.includes(query) || disciplineName.includes(query);
  });

  const availableRanks = ranks.filter((r) => {
    const currentRank = getCurrentRank(formData.member_id, formData.discipline_id);
    if (!currentRank) return true;
    return r.level > (currentRank.rank?.level || 0);
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Belt & Rank Promotions</h2>
          <p className="text-sm text-muted-foreground">Promote members through belt/rank levels</p>
        </div>
        <Button onClick={() => setIsPromoteDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Promote Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Medal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{memberRanks.length}</p>
                <p className="text-xs text-muted-foreground">Active Ranks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotionHistory.length}</p>
                <p className="text-xs text-muted-foreground">Promotions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{disciplines.length}</p>
                <p className="text-xs text-muted-foreground">Disciplines</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members or disciplines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Current Member Ranks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Member Ranks</CardTitle>
          <CardDescription>Members with assigned belt/rank levels</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMemberRanks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No member ranks found</p>
          ) : (
            <div className="space-y-3">
              {filteredMemberRanks.map((mr) => (
                <div
                  key={mr.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{mr.member?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{mr.discipline?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      style={{
                        backgroundColor: mr.rank?.color ? `${mr.rank.color}20` : undefined,
                        color: mr.rank?.color || undefined,
                        borderColor: mr.rank?.color ? `${mr.rank.color}40` : undefined,
                      }}
                      variant="outline"
                    >
                      {mr.rank?.name || 'No Rank'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mr.awarded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promotion History */}
      {promotionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Promotion History
            </CardTitle>
            <CardDescription>Recent belt/rank promotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {promotionHistory.slice(0, 10).map((promotion) => (
                <div
                  key={promotion.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{promotion.member?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{promotion.discipline?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {promotion.from_rank && (
                      <>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: promotion.from_rank?.color ? `${promotion.from_rank.color}20` : undefined,
                            color: promotion.from_rank?.color || undefined,
                          }}
                        >
                          {promotion.from_rank.name}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </>
                    )}
                    <Badge
                      style={{
                        backgroundColor: promotion.to_rank?.color ? `${promotion.to_rank.color}20` : undefined,
                        color: promotion.to_rank?.color || undefined,
                      }}
                    >
                      {promotion.to_rank?.name || 'Unknown'}
                    </Badge>
                    <p className="text-xs text-muted-foreground ml-2">
                      {format(new Date(promotion.promotion_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promote Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={formData.member_id} onValueChange={(v) => setFormData(prev => ({ ...prev, member_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discipline</Label>
              <Select value={formData.discipline_id} onValueChange={(v) => setFormData(prev => ({ ...prev, discipline_id: v, to_rank_id: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select discipline" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.member_id && formData.discipline_id && (
              <>
                {getCurrentRank(formData.member_id, formData.discipline_id) && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Current Rank:</p>
                    <p className="font-medium">
                      {getCurrentRank(formData.member_id, formData.discipline_id)?.rank?.name || 'None'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Promote To</Label>
                  <Select value={formData.to_rank_id} onValueChange={(v) => setFormData(prev => ({ ...prev, to_rank_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRanks.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: r.color || '#gray' }}
                            />
                            {r.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableRanks.length === 0 && ranks.length > 0 && (
                    <p className="text-xs text-muted-foreground">Member already at highest rank</p>
                  )}
                  {ranks.length === 0 && (
                    <p className="text-xs text-amber-500">No ranks defined for this discipline. Add ranks in Training Library first.</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Promotion notes, achievements, etc..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePromote} disabled={isSubmitting || !formData.to_rank_id}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
