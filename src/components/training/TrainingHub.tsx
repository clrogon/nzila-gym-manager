import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGym } from '@/contexts/GymContext';
import { useDisciplinesData } from '@/hooks/useDisciplinesData.tanstack';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Sparkles
} from 'lucide-react';

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

interface DisciplineCard {
  id: string;
  name: string;
  description: string;
  image: string;
  level: string;
  duration: string;
  rating: number;
  category: string;
}

const mockTrainingPaths: TrainingPath[] = [
  {
    id: '1',
    name: 'Fundamentos de Força',
    description: 'Construa uma base sólida',
    progress: 75,
    totalModules: 8,
    completedModules: 6,
    icon: Dumbbell,
    color: 'text-primary'
  },
  {
    id: '2',
    name: 'Condicionamento Cardio',
    description: 'Melhore resistência e energia',
    progress: 40,
    totalModules: 6,
    completedModules: 2,
    icon: Flame,
    color: 'text-orange-500'
  },
  {
    id: '3',
    name: 'Flexibilidade Avançada',
    description: 'Mobilidade e recuperação',
    progress: 20,
    totalModules: 10,
    completedModules: 2,
    icon: Zap,
    color: 'text-blue-500'
  }
];

const mockDisciplines: DisciplineCard[] = [
  {
    id: '1',
    name: 'Strength & Conditioning',
    description: 'Power building e performance atlética de elite',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop',
    level: 'Avançado',
    duration: '12 Semanas',
    rating: 4.9,
    category: 'Força'
  },
  {
    id: '2',
    name: 'High-Intensity Training',
    description: 'Treino intensivo para queima máxima',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop',
    level: 'Intermediário',
    duration: '8 Semanas',
    rating: 4.8,
    category: 'HIIT'
  },
  {
    id: '3',
    name: 'Elite Yoga & Mobility',
    description: 'Flexibilidade e equilíbrio mente-corpo',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
    level: 'Todos os níveis',
    duration: '6 Semanas',
    rating: 5.0,
    category: 'Mindfulness'
  },
  {
    id: '4',
    name: 'Functional Training',
    description: 'Movimentos práticos para o dia-a-dia',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop',
    level: 'Iniciante',
    duration: '10 Semanas',
    rating: 4.7,
    category: 'Funcional'
  }
];

export function TrainingHub() {
  const { currentGym } = useGym();
  const navigate = useNavigate();
  const { activeDisciplines } = useDisciplinesData(currentGym?.id);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', 'Força', 'HIIT', 'Mindfulness', 'Funcional'];

  const filteredDisciplines = selectedCategory === 'all' 
    ? mockDisciplines 
    : mockDisciplines.filter(d => d.category === selectedCategory);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/10 border border-white/10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920')] bg-cover bg-center opacity-20" />
          <div className="relative z-10 p-8 md:p-12">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Hub de Treino Elite
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Treino & <span className="text-gradient">Disciplinas</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mb-6">
              Explore programas personalizados de classe mundial e disciplinas especializadas para alcançar o seu potencial máximo.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Play className="w-4 h-4 mr-2" />
                Continuar Treino
              </Button>
              <Button variant="outline" className="border-white/20 hover:bg-white/5">
                Explorar Programas
              </Button>
            </div>
          </div>
        </div>

        {/* Training Path */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold">O Seu Caminho de Treino</h2>
                <p className="text-sm text-muted-foreground">Progresso nos módulos ativos</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {mockTrainingPaths.map((path) => (
              <TrainingPathCard key={path.id} path={path} />
            ))}
          </div>
        </section>

        {/* Disciplines Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold">Explorar Disciplinas</h2>
                <p className="text-sm text-muted-foreground">Programas especializados de elite</p>
              </div>
            </div>
          </div>

          {/* Category Filters */}
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

          {/* Discipline Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredDisciplines.map((discipline) => (
              <DisciplineCardComponent key={discipline.id} discipline={discipline} />
            ))}
          </div>
        </section>

        {/* Achievement Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold">Conquistas Recentes</h2>
          </div>
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <AchievementBadge icon={Flame} title="7 Dias Seguidos" unlocked />
            <AchievementBadge icon={Dumbbell} title="100 Treinos" unlocked />
            <AchievementBadge icon={TrendingUp} title="Progresso 50%" unlocked={false} />
            <AchievementBadge icon={Star} title="Elite Member" unlocked />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function TrainingPathCard({ path }: { path: TrainingPath }) {
  const Icon = path.icon;
  
  return (
    <Card className="glass border-white/10 hover:border-primary/30 transition-all cursor-pointer group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/5 ${path.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="outline" className="text-xs">
            {path.completedModules}/{path.totalModules} Módulos
          </Badge>
        </div>
        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{path.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="text-primary font-medium">{path.progress}%</span>
          </div>
          <Progress value={path.progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function DisciplineCardComponent({ discipline }: { discipline: DisciplineCard }) {
  return (
    <Card className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${discipline.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
            {discipline.category}
          </Badge>
          <h3 className="text-xl font-display font-bold">{discipline.name}</h3>
        </div>
      </div>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">{discipline.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {discipline.duration}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              {discipline.rating}
            </span>
          </div>
          <Badge variant="outline" className="border-white/20">
            {discipline.level}
          </Badge>
        </div>
        <Button 
          className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
        >
          Explorar Programa
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function AchievementBadge({ icon: Icon, title, unlocked }: { icon: React.ElementType; title: string; unlocked: boolean }) {
  return (
    <Card className={`glass border-white/10 text-center py-4 ${!unlocked && 'opacity-50'}`}>
      <CardContent className="p-0">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
          unlocked ? 'bg-primary/20' : 'bg-muted'
        }`}>
          <Icon className={`w-6 h-6 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <p className="text-xs font-medium">{title}</p>
        {unlocked && (
          <Badge variant="outline" className="mt-1 text-[10px] border-primary/30 text-primary">
            Desbloqueado
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default TrainingHub;