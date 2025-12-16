import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Edit2, Loader2, Award, Target, Clock, CheckCircle, Users, TrendingUp
} from 'lucide-react';

interface Discipline {
  id: string;
  name: string;
  category: string | null;
}

interface DisciplineRank {
  id: string;
  discipline_id: string;
  name: string;
  level: number;
  color: string | null;
  criteria: {
    min_classes: number;
    min_days_in_rank: number;
    performance_requirements: string[];
  } | null;
}

interface EligibleMember {
  id: string;
  full_name: string;
  email: string | null;
  discipline_id: string;
  discipline_name: string;
  current_rank_id: string | null;
  current_rank_name: string | null;
  current_rank_level: number;
  next_rank_id: string;
  next_rank_name: string;
  next_rank_color: string | null;
  classes_attended: number;
  days_in_rank: number;
  meets_criteria: boolean;
}

export function PromotionCriteria() {
  const { currentGym } = useGym();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [ranks, setRanks] = useState<DisciplineRank[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  // Dialog states
  const [isEditCriteriaOpen, setIsEditCriteriaOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<DisciplineRank | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [criteriaForm, setCriteriaForm] = useState({
    min_classes: 0,
    min_days_in_rank: 0,
    performance_requirements: [] as string[],
  });

  useEffect(() => {
    if (currentGym?.id) {
      fetchData();
    }
  }, [currentGym?.id]);

  const fetchData = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const [disciplinesRes, ranksRes] = await Promise.all([
        supabase
          .from('disciplines')
          .select('id, name, category')
          .eq('gym_id', currentGym.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('discipline_ranks')
          .select('*')
          .order('level'),
      ]);

      if (disciplinesRes.error) throw disciplinesRes.error;
      if (ranksRes.error) throw ranksRes.error;

      // Filter ranks to only include those for the gym's disciplines
      const gymDisciplineIds = (disciplinesRes.data || []).map(d => d.id);
      const gymRanks = (ranksRes.data || [])
        .filter(r => gymDisciplineIds.includes(r.discipline_id))
        .map(r => ({
          ...r,
          criteria: r.criteria as DisciplineRank['criteria'],
        }));

      setDisciplines(disciplinesRes.data || []);
      setRanks(gymRanks);

      // Calculate eligible members
      await calculateEligibleMembers(disciplinesRes.data || [], gymRanks);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateEligibleMembers = async (discs: Discipline[], rks: DisciplineRank[]) => {
    if (!currentGym?.id) return;

    try {
      // Get all members with their current ranks
      const { data: memberRanks } = await supabase
        .from('member_ranks')
        .select(`
          *,
          member:members(id, full_name, email, gym_id),
          discipline:disciplines(id, name),
          rank:discipline_ranks(id, name, level, color)
        `);

      // Get class attendance counts
      const { data: classBookings } = await supabase
        .from('class_bookings')
        .select('member_id, status')
        .eq('status', 'attended');

      // Group bookings by member
      const attendanceCounts: Record<string, number> = {};
      (classBookings || []).forEach(b => {
        attendanceCounts[b.member_id] = (attendanceCounts[b.member_id] || 0) + 1;
      });

      // Get all active members
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name, email')
        .eq('gym_id', currentGym.id)
        .eq('status', 'active');

      const eligible: EligibleMember[] = [];

      // For each discipline, check who is eligible for promotion
      for (const disc of discs) {
        const discRanks = rks.filter(r => r.discipline_id === disc.id).sort((a, b) => a.level - b.level);
        if (discRanks.length === 0) continue;

        for (const member of (members || [])) {
          // Get member's current rank in this discipline
          const memberRank = memberRanks?.find(
            mr => mr.member_id === member.id && mr.discipline_id === disc.id
          );

          const currentRank = memberRank?.rank;
          const currentLevel = currentRank?.level || 0;

          // Find next rank
          const nextRank = discRanks.find(r => r.level > currentLevel);
          if (!nextRank) continue; // Already at max rank

          const criteria = nextRank.criteria || { min_classes: 0, min_days_in_rank: 0, performance_requirements: [] };
          const classesAttended = attendanceCounts[member.id] || 0;
          const daysInRank = memberRank 
            ? Math.floor((Date.now() - new Date(memberRank.awarded_at).getTime()) / (1000 * 60 * 60 * 24))
            : 999; // If no rank, assume they've been waiting long enough

          const meetsCriteria = 
            classesAttended >= criteria.min_classes &&
            daysInRank >= criteria.min_days_in_rank;

          if (meetsCriteria || classesAttended > 0) {
            eligible.push({
              id: member.id,
              full_name: member.full_name,
              email: member.email,
              discipline_id: disc.id,
              discipline_name: disc.name,
              current_rank_id: currentRank?.id || null,
              current_rank_name: currentRank?.name || null,
              current_rank_level: currentLevel,
              next_rank_id: nextRank.id,
              next_rank_name: nextRank.name,
              next_rank_color: nextRank.color,
              classes_attended: classesAttended,
              days_in_rank: daysInRank,
              meets_criteria: meetsCriteria,
            });
          }
        }
      }

      setEligibleMembers(eligible.sort((a, b) => {
        // Sort by meets_criteria first, then by classes attended
        if (a.meets_criteria !== b.meets_criteria) return a.meets_criteria ? -1 : 1;
        return b.classes_attended - a.classes_attended;
      }));
    } catch (error) {
      console.error('Error calculating eligible members:', error);
    }
  };

  const openEditCriteria = (rank: DisciplineRank) => {
    setEditingRank(rank);
    setCriteriaForm({
      min_classes: rank.criteria?.min_classes || 0,
      min_days_in_rank: rank.criteria?.min_days_in_rank || 0,
      performance_requirements: rank.criteria?.performance_requirements || [],
    });
    setIsEditCriteriaOpen(true);
  };

  const handleUpdateCriteria = async () => {
    if (!editingRank?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('discipline_ranks')
        .update({
          criteria: criteriaForm,
        })
        .eq('id', editingRank.id);

      if (error) throw error;
      toast.success('Critérios atualizados');
      setIsEditCriteriaOpen(false);
      setEditingRank(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Falha ao atualizar critérios');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRanksForDiscipline = (disciplineId: string) => {
    return ranks.filter(r => r.discipline_id === disciplineId).sort((a, b) => a.level - b.level);
  };

  const filteredEligible = selectedDiscipline === 'all'
    ? eligibleMembers
    : eligibleMembers.filter(m => m.discipline_id === selectedDiscipline);

  const readyCount = filteredEligible.filter(m => m.meets_criteria).length;

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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{disciplines.length}</p>
                <p className="text-xs text-muted-foreground">Disciplinas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Target className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ranks.length}</p>
                <p className="text-xs text-muted-foreground">Ranks/Faixas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyCount}</p>
                <p className="text-xs text-muted-foreground">Prontos p/ Promoção</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{eligibleMembers.length}</p>
                <p className="text-xs text-muted-foreground">Em Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Criteria by Discipline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Critérios de Promoção</CardTitle>
          <CardDescription>Defina os requisitos para cada rank/faixa</CardDescription>
        </CardHeader>
        <CardContent>
          {disciplines.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma disciplina configurada. Crie disciplinas primeiro.
            </p>
          ) : (
            <div className="space-y-4">
              {disciplines.map(disc => (
                <div key={disc.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{disc.name}</h4>
                  <div className="space-y-2">
                    {getRanksForDiscipline(disc.id).map(rank => (
                      <div 
                        key={rank.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            style={{
                              backgroundColor: rank.color ? `${rank.color}20` : undefined,
                              color: rank.color || undefined,
                              borderColor: rank.color ? `${rank.color}40` : undefined,
                            }}
                            variant="outline"
                          >
                            Nível {rank.level}: {rank.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {rank.criteria?.min_classes || 0} aulas • {rank.criteria?.min_days_in_rank || 0} dias
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openEditCriteria(rank)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {getRanksForDiscipline(disc.id).length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        Nenhum rank definido para esta disciplina
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligible Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Membros Elegíveis para Promoção
              </CardTitle>
              <CardDescription>Membros que atendem ou estão próximos dos critérios</CardDescription>
            </div>
            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas disciplinas</SelectItem>
                {disciplines.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEligible.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum membro elegível encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEligible.map((member, idx) => (
                <div
                  key={`${member.id}-${member.discipline_id}-${idx}`}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    member.meets_criteria ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${member.meets_criteria ? 'bg-green-500/10' : 'bg-muted'}`}>
                      {member.meets_criteria ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.discipline_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {member.current_rank_name && (
                          <Badge variant="outline">{member.current_rank_name}</Badge>
                        )}
                        <span className="text-muted-foreground">→</span>
                        <Badge
                          style={{
                            backgroundColor: member.next_rank_color ? `${member.next_rank_color}20` : undefined,
                            color: member.next_rank_color || undefined,
                          }}
                        >
                          {member.next_rank_name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {member.classes_attended} aulas • {member.days_in_rank} dias no rank atual
                      </p>
                    </div>
                    {member.meets_criteria && (
                      <Badge className="bg-green-500">Pronto</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Criteria Dialog */}
      <Dialog open={isEditCriteriaOpen} onOpenChange={setIsEditCriteriaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Critérios de Promoção</DialogTitle>
            <DialogDescription>
              Defina os requisitos para alcançar "{editingRank?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Mínimo de Aulas Frequentadas</Label>
              <Input
                type="number"
                value={criteriaForm.min_classes}
                onChange={(e) => setCriteriaForm(prev => ({ 
                  ...prev, 
                  min_classes: parseInt(e.target.value) || 0 
                }))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Número de aulas que o membro deve frequentar
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dias Mínimos no Rank Atual</Label>
              <Input
                type="number"
                value={criteriaForm.min_days_in_rank}
                onChange={(e) => setCriteriaForm(prev => ({ 
                  ...prev, 
                  min_days_in_rank: parseInt(e.target.value) || 0 
                }))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Tempo mínimo de permanência no rank atual antes de poder ser promovido
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCriteriaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCriteria} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Critérios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
