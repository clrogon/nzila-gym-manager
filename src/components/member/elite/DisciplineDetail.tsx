import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGym } from '@/contexts/GymContext';
import { useDisciplinesData } from '@/hooks/useDisciplinesData.tanstack';
import { useWorkoutsData } from '@/hooks/useWorkoutsData.tanstack';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft,
  Dumbbell,
  Users,
  Clock,
  Target,
  Award,
  Zap,
  Calendar,
  Star,
  ChevronRight,
  Play
} from 'lucide-react';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  strength: Dumbbell,
  cardio: Zap,
  yoga: Target,
  martial_arts: Award,
  default: Dumbbell,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  strength: 'from-orange-500/20 via-red-500/10 to-transparent',
  cardio: 'from-green-500/20 via-emerald-500/10 to-transparent',
  yoga: 'from-purple-500/20 via-violet-500/10 to-transparent',
  martial_arts: 'from-red-500/20 via-orange-500/10 to-transparent',
  default: 'from-primary/20 via-brand-accent/10 to-transparent',
};

export function DisciplineDetail() {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const { currentGym } = useGym();
  const navigate = useNavigate();

  const { disciplines, disciplineRanks, loading: loadingDisciplines } = useDisciplinesData(currentGym?.id);
  const { templates, loading: loadingWorkouts } = useWorkoutsData(currentGym?.id);

  // Find the discipline
  const discipline = useMemo(() => {
    return disciplines.find(d => d.id === disciplineId);
  }, [disciplines, disciplineId]);

  // Get ranks for this discipline
  const ranks = useMemo(() => {
    return disciplineRanks.filter(r => r.discipline_id === disciplineId)
      .sort((a, b) => a.level - b.level);
  }, [disciplineRanks, disciplineId]);

  // Get related workouts
  const relatedWorkouts = useMemo(() => {
    return templates.filter(t => 
      t.category?.toLowerCase() === discipline?.category?.toLowerCase() ||
      t.name.toLowerCase().includes(discipline?.name?.toLowerCase() || '')
    ).slice(0, 4);
  }, [templates, discipline]);

  const loading = loadingDisciplines || loadingWorkouts;
  const Icon = CATEGORY_ICONS[discipline?.category || 'default'] || Dumbbell;
  const gradient = CATEGORY_GRADIENTS[discipline?.category || 'default'] || CATEGORY_GRADIENTS.default;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!discipline) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Disciplina Não Encontrada</h2>
          <p className="text-muted-foreground mb-4">A disciplina solicitada não existe.</p>
          <Button onClick={() => navigate('/training-hub')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar ao Hub
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/training-hub')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Hub de Treino
        </Button>

        {/* Hero Section */}
        <Card className="glass border-white/10 overflow-hidden">
          <div className={`relative h-64 md:h-80 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <Badge className="bg-primary/20 text-primary border-primary/30 w-fit mb-3">
                {discipline.category || 'Geral'}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {discipline.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {discipline.description || 'Descubra uma nova forma de treino e transforme o seu corpo e mente.'}
              </p>
            </div>

            {/* Icon */}
            <div className="absolute top-6 right-6 w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Quick Stats */}
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <Users className="w-5 h-5 text-primary mx-auto" />
                <p className="text-lg font-bold">{Math.floor(Math.random() * 200) + 50}+</p>
                <p className="text-xs text-muted-foreground">Praticantes</p>
              </div>
              <div className="space-y-1">
                <Calendar className="w-5 h-5 text-primary mx-auto" />
                <p className="text-lg font-bold">{Math.floor(Math.random() * 10) + 5}</p>
                <p className="text-xs text-muted-foreground">Aulas/Semana</p>
              </div>
              <div className="space-y-1">
                <Award className="w-5 h-5 text-primary mx-auto" />
                <p className="text-lg font-bold">{ranks.length}</p>
                <p className="text-xs text-muted-foreground">Níveis</p>
              </div>
              <div className="space-y-1">
                <Star className="w-5 h-5 text-primary mx-auto" />
                <p className="text-lg font-bold">4.9</p>
                <p className="text-xs text-muted-foreground">Avaliação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Programs & Workouts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specialized Programs */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Programas Especializados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedWorkouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum programa disponível ainda.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {relatedWorkouts.map((workout) => (
                      <button
                        key={workout.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all text-left group"
                        onClick={() => navigate(`/training`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-primary" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="font-semibold mb-1">{workout.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.estimated_duration || 45} min
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {workout.difficulty || 'Intermédio'}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coaching Philosophy */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Filosofia de Treino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  A nossa abordagem ao {discipline.name} combina técnicas tradicionais com métodos 
                  modernos de treino, focando no desenvolvimento holístico do praticante. 
                  Cada sessão é desenhada para desafiar os limites enquanto respeita os princípios 
                  de progressão segura e sustentável.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Técnica', desc: 'Foco na forma perfeita' },
                    { label: 'Progressão', desc: 'Evolução gradual' },
                    { label: 'Segurança', desc: 'Prevenção de lesões' },
                  ].map((pillar, index) => (
                    <div key={index} className="text-center p-3 rounded-lg bg-white/5">
                      <p className="font-semibold text-primary mb-1">{pillar.label}</p>
                      <p className="text-xs text-muted-foreground">{pillar.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranks & Progression */}
          <div className="space-y-6">
            {/* Belt/Rank System */}
            {ranks.length > 0 && (
              <Card className="glass border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Sistema de Graduação
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {ranks.map((rank, index) => (
                      <div 
                        key={rank.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: rank.color ? `${rank.color}30` : 'hsl(var(--primary) / 0.2)',
                            borderColor: rank.color || 'hsl(var(--primary))',
                            borderWidth: '2px'
                          }}
                        >
                          <span className="text-xs font-bold">{rank.level}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{rank.name}</p>
                          {rank.requirements && (
                            <p className="text-xs text-muted-foreground truncate">
                              {rank.requirements}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Começar Agora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate('/calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Horário de Aulas
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-white/10 hover:border-primary/50"
                  onClick={() => navigate('/member/trainers')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Encontrar Instrutor
                </Button>
                {relatedWorkouts.length > 0 && (
                  <Button 
                    variant="outline"
                    className="w-full border-white/10 hover:border-primary/50"
                    onClick={() => navigate('/training')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Treinar Agora
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DisciplineDetail;
