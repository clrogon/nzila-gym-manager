import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGym } from '@/contexts/GymContext';
import { useDisciplinesData } from '@/hooks/useDisciplinesData.tanstack';
import { useWorkoutsData } from '@/hooks/useWorkoutsData.tanstack';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronRight, 
  Dumbbell, 
  Flame, 
  Target,
  Award,
  Zap,
  Clock,
  Star,
  Play,
  TrendingUp,
  Trophy,
  Sparkles,
  BookOpen
} from 'lucide-react';

// Map categories to icons and colors
const categoryConfig: Record<string, { icon: React.ElementType; color: string; image: string }> = {
  'strength': { 
    icon: Dumbbell, 
    color: 'text-primary',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop'
  },
  'força': { 
    icon: Dumbbell, 
    color: 'text-primary',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop'
  },
  'cardio': { 
    icon: Flame, 
    color: 'text-orange-500',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop'
  },
  'hiit': { 
    icon: Zap, 
    color: 'text-yellow-500',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop'
  },
  'yoga': { 
    icon: Target, 
    color: 'text-blue-500',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop'
  },
  'mindfulness': { 
    icon: Target, 
    color: 'text-blue-500',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop'
  },
  'functional': { 
    icon: TrendingUp, 
    color: 'text-green-500',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop'
  },
  'funcional': { 
    icon: TrendingUp, 
    color: 'text-green-500',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop'
  },
  'default': { 
    icon: Award, 
    color: 'text-primary',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop'
  }
};

const getConfig = (category: string | null) => {
  if (!category) return categoryConfig['default'];
  const key = category.toLowerCase();
  return categoryConfig[key] || categoryConfig['default'];
};

export function TrainingHub() {
  const { currentGym } = useGym();
  const navigate = useNavigate();
  const { activeDisciplines, loading: loadingDisciplines, ranksByDiscipline } = useDisciplinesData(currentGym?.id);
  const { templates, templatesByCategory, loading: loadingWorkouts } = useWorkoutsData(currentGym?.id);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Get unique categories from disciplines and workout templates
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('all');
    
    activeDisciplines.forEach(d => {
      if (d.category) cats.add(d.category);
    });
    
    Object.keys(templatesByCategory).forEach(cat => {
      if (cat !== 'uncategorized') cats.add(cat);
    });
    
    return Array.from(cats);
  }, [activeDisciplines, templatesByCategory]);

  // Filter disciplines by category
  const filteredDisciplines = useMemo(() => {
    if (selectedCategory === 'all') return activeDisciplines;
    return activeDisciplines.filter(d => 
      d.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [activeDisciplines, selectedCategory]);

  // Create training paths from workout categories
  const trainingPaths = useMemo(() => {
    return Object.entries(templatesByCategory)
      .filter(([cat]) => cat !== 'uncategorized')
      .slice(0, 3)
      .map(([category, workouts]) => {
        const config = getConfig(category);
        return {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          description: `${workouts.length} treinos disponíveis`,
          totalModules: workouts.length,
          completedModules: 0, // Could be enhanced with member progress data
          progress: 0,
          icon: config.icon,
          color: config.color
        };
      });
  }, [templatesByCategory]);

  const loading = loadingDisciplines || loadingWorkouts;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/10 border border-white/10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 p-8 md:p-12">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Hub de Treino
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Treino & <span className="text-gradient">Disciplinas</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mb-6">
              {activeDisciplines.length > 0 
                ? `Explore ${activeDisciplines.length} disciplinas e ${templates.length} treinos disponíveis.`
                : 'Explore programas personalizados para alcançar o seu potencial máximo.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate('/training')}
              >
                <Play className="w-4 h-4 mr-2" />
                Ver Treinos
              </Button>
              <Button 
                variant="outline" 
                className="border-white/20 hover:bg-white/5"
                onClick={() => navigate('/disciplines')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explorar Disciplinas
              </Button>
            </div>
          </div>
        </div>

        {/* Training Paths from Workout Categories */}
        {trainingPaths.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">Categorias de Treino</h2>
                  <p className="text-sm text-muted-foreground">{templates.length} treinos disponíveis</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/training')}
              >
                Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {trainingPaths.map((path) => (
                <TrainingPathCard key={path.id} path={path} onClick={() => navigate('/training')} />
              ))}
            </div>
          </section>
        )}

        {/* Disciplines Section */}
        {activeDisciplines.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">Disciplinas</h2>
                  <p className="text-sm text-muted-foreground">{activeDisciplines.length} disciplinas ativas</p>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            {categories.length > 2 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-white/20 hover:bg-white/5'
                    }
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </Button>
                ))}
              </div>
            )}

            {/* Discipline Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {filteredDisciplines.map((discipline) => (
                <DisciplineCardComponent 
                  key={discipline.id} 
                  discipline={discipline}
                  ranksCount={ranksByDiscipline[discipline.id]?.length || 0}
                  onClick={() => navigate('/disciplines')}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {activeDisciplines.length === 0 && templates.length === 0 && (
          <Card className="glass border-white/10 p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ainda não há conteúdo</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              As disciplinas e treinos serão exibidos aqui quando estiverem disponíveis.
            </p>
          </Card>
        )}

        {/* Quick Stats */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold">Resumo</h2>
          </div>
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <QuickStatCard 
              icon={Award} 
              title="Disciplinas" 
              value={activeDisciplines.length.toString()} 
            />
            <QuickStatCard 
              icon={Dumbbell} 
              title="Treinos" 
              value={templates.length.toString()} 
            />
            <QuickStatCard 
              icon={Star} 
              title="Categorias" 
              value={(categories.length - 1).toString()} 
            />
            <QuickStatCard 
              icon={TrendingUp} 
              title="Rankings" 
              value={Object.values(ranksByDiscipline).flat().length.toString()} 
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

interface TrainingPath {
  id: string;
  name: string;
  description: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  icon: React.ElementType;
  color: string;
}

function TrainingPathCard({ path, onClick }: { path: TrainingPath; onClick: () => void }) {
  const Icon = path.icon;
  
  return (
    <Card 
      className="glass border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/5 ${path.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="outline" className="text-xs">
            {path.totalModules} Treinos
          </Badge>
        </div>
        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{path.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
        <Button size="sm" variant="ghost" className="w-full text-primary">
          Explorar <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface Discipline {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean | null;
}

function DisciplineCardComponent({ 
  discipline, 
  ranksCount,
  onClick 
}: { 
  discipline: Discipline;
  ranksCount: number;
  onClick: () => void;
}) {
  const config = getConfig(discipline.category);
  
  return (
    <Card 
      className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${config.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          {discipline.category && (
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
              {discipline.category}
            </Badge>
          )}
          <h3 className="text-xl font-display font-bold">{discipline.name}</h3>
        </div>
      </div>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {discipline.description || 'Explore esta disciplina e desenvolva as suas habilidades.'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            {ranksCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-primary" />
                {ranksCount} níveis
              </span>
            )}
          </div>
          <Badge variant="outline" className="border-success/50 text-success">
            Ativo
          </Badge>
        </div>
        <Button 
          className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
        >
          Ver Detalhes
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickStatCard({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string }) {
  return (
    <Card className="glass border-white/10 text-center py-4">
      <CardContent className="p-0">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-primary/20">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

export default TrainingHub;
