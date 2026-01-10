import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  Star,
  Filter,
  Calendar,
  Clock,
  ChevronRight,
  Award,
  Users,
  Dumbbell,
  Heart,
  Zap,
  Info
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Trainer {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  specialty?: string;
  rating?: number;
  reviews_count?: number;
  title?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const SPECIALTIES = [
  { id: 'all', label: 'Todas Especialidades', icon: Filter },
  { id: 'strength', label: 'Força', icon: Dumbbell },
  { id: 'yoga', label: 'Yoga', icon: Heart },
  { id: 'cardio', label: 'Cardio', icon: Zap },
  { id: 'nutrition', label: 'Nutrição', icon: Award },
];

// Mock time slots (in production, fetch from classes/availability)
const MOCK_TIME_SLOTS: TimeSlot[] = [
  { time: '09:00 - 10:30', available: true },
  { time: '13:30 - 15:00', available: true },
  { time: '17:00 - 18:30', available: true },
];

export function TrainerBooking() {
  const { currentGym } = useGym();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch trainers from profiles (mock data for demo)
  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      
      // Fetch profiles as potential trainers
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .limit(8);
      
      if (error) throw error;
      
      // Transform to trainer format with mock data for demo
      return (profiles || []).map((p, index) => ({
        id: p.id,
        full_name: p.full_name || 'Treinador Elite',
        email: p.email,
        avatar_url: p.avatar_url,
        specialty: SPECIALTIES[1 + (index % 4)].id,
        rating: 4.5 + Math.random() * 0.5,
        reviews_count: Math.floor(50 + Math.random() * 200),
        title: ['Master Trainer', 'Senior Instructor', 'Functional Lead', 'Specialist'][index % 4]
      })) as Trainer[];
    },
    enabled: !!currentGym?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  // Filter trainers
  const filteredTrainers = useMemo(() => {
    if (!trainers) return [];
    
    return trainers.filter(trainer => {
      const matchesSearch = trainer.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' || trainer.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [trainers, searchQuery, selectedSpecialty]);

  const getSpecialtyLabel = (id: string) => {
    return SPECIALTIES.find(s => s.id === id)?.label || 'Geral';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Encontre o Seu <span className="text-gradient">Treinador Elite</span>
          </h1>
          <p className="text-muted-foreground">
            Instrutores de classe mundial selecionados para a sua jornada fitness.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar treinadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-white/10 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SPECIALTIES.map((specialty) => (
              <Button
                key={specialty.id}
                variant={selectedSpecialty === specialty.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSpecialty(specialty.id)}
                className={selectedSpecialty === specialty.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'border-white/10 hover:border-primary/50'
                }
              >
                <specialty.icon className="w-4 h-4 mr-1" />
                {specialty.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Trainers List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredTrainers.length === 0 ? (
              <Card className="glass border-white/10 p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum Treinador Encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou a pesquisa.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTrainers.map((trainer) => (
                  <TrainerCard
                    key={trainer.id}
                    trainer={trainer}
                    specialtyLabel={getSpecialtyLabel(trainer.specialty || 'all')}
                    onClick={() => navigate(`/member/trainers/${trainer.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Sidebar */}
          <div className="space-y-6">
            <Card className="glass border-white/10 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agendar Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mini Calendar */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {format(new Date(), 'MMMM yyyy', { locale: pt })}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                      <span key={day} className="text-muted-foreground">{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date) => {
                      const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            p-2 rounded-lg text-sm font-medium transition-all
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : isToday 
                                ? 'bg-primary/20 text-primary' 
                                : 'hover:bg-white/5'
                            }
                          `}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Slots */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Horários Disponíveis</p>
                  {MOCK_TIME_SLOTS.map((slot, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm">{slot.time}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking Policy */}
            <Card className="glass border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Política de Reserva</p>
                    <p className="text-xs text-muted-foreground">
                      Cancele com pelo menos 12 horas de antecedência para manter o seu crédito de sessão.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Trainer Card Component
function TrainerCard({ 
  trainer, 
  specialtyLabel,
  onClick 
}: { 
  trainer: Trainer;
  specialtyLabel: string;
  onClick: () => void;
}) {
  return (
    <Card 
      className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        {trainer.avatar_url ? (
          <img
            src={trainer.avatar_url}
            alt={trainer.full_name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-brand-accent/20 flex items-center justify-center">
            <Users className="w-16 h-16 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm">
          {trainer.title || 'Trainer'}
        </Badge>
      </div>
      
      <CardContent className="relative pt-4 -mt-8">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold">{trainer.full_name}</h3>
            <p className="text-sm text-primary">{specialtyLabel}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <Button 
              size="sm" 
              className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Ver Perfil & Reservar
            </Button>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm font-medium">
                {trainer.rating?.toFixed(1) || '5.0'}
              </span>
              <span className="text-xs text-muted-foreground">
                ({trainer.reviews_count || 0}+)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainerBooking;
