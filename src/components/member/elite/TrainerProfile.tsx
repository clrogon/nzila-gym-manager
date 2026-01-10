import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  Award,
  Users,
  Dumbbell,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  time: string;
  available: boolean;
}

const MOCK_TIME_SLOTS: TimeSlot[] = [
  { time: '08:00 - 09:30', available: true },
  { time: '10:00 - 11:30', available: true },
  { time: '16:30 - 18:00', available: true },
];

export function TrainerProfile() {
  const { trainerId } = useParams<{ trainerId: string }>();
  const { currentGym } = useGym();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Fetch trainer profile
  const { data: trainer, isLoading } = useQuery({
    queryKey: ['trainer', trainerId],
    queryFn: async () => {
      if (!trainerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', trainerId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Enhance with mock data for demo
      return data ? {
        ...data,
        title: 'Master Trainer',
        specialty: 'Força & Alta Performance',
        rating: 4.9,
        reviews_count: 120,
        years_experience: 10,
        clients_trained: 500,
        bio: `Com uma década de experiência treinando atletas profissionais e executivos de alto desempenho, 
desenvolveu uma metodologia exclusiva que une o fisiculturismo tradicional à funcionalidade atlética. 
A sua abordagem é baseada na ciência do desporto, focando na eficiência mecânica, 
desenvolvimento de potência explosiva e performance de pico sustentável.`,
        specialties: [
          { icon: Dumbbell, label: 'Levantamento de Peso', desc: 'Técnicas olímpicas e powerlifting para máxima potência.' },
          { icon: Zap, label: 'HIIT', desc: 'Treino intervalado de alta intensidade para perda de gordura.' },
          { icon: Award, label: 'Performance Atlética', desc: 'Drills específicos para agilidade e velocidade.' },
        ]
      } : null;
    },
    enabled: !!trainerId,
    staleTime: 10 * 60 * 1000,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, []);

  const handleBookSession = async () => {
    if (!selectedSlot || !trainer) return;
    
    // In production, create a class booking here
    toast({
      title: 'Sessão Reservada!',
      description: `A sua sessão com ${trainer.full_name} foi confirmada para ${format(selectedDate, 'dd/MM')} às ${selectedSlot.split(' - ')[0]}.`,
    });
    
    navigate('/member/bookings');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Treinador Não Encontrado</h2>
          <p className="text-muted-foreground mb-4">O perfil solicitado não existe.</p>
          <Button onClick={() => navigate('/member/trainers')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/member/trainers')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Treinadores
        </Button>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Trainer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="glass border-white/10 overflow-hidden">
              <div className="relative">
                {/* Hero Image */}
                <div className="h-64 md:h-80 overflow-hidden">
                  {trainer.avatar_url ? (
                    <img
                      src={trainer.avatar_url}
                      alt={trainer.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card to-brand-accent/20 flex items-center justify-center">
                      <Users className="w-24 h-24 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-primary/20 text-primary border-primary/30 mb-3">
                    {trainer.title}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                    {trainer.full_name}
                  </h1>
                  <p className="text-primary text-lg">{trainer.specialty}</p>
                </div>
              </div>

              {/* Stats */}
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{trainer.years_experience}+</p>
                    <p className="text-sm text-muted-foreground">Anos Experiência</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{trainer.clients_trained}+</p>
                    <p className="text-sm text-muted-foreground">Clientes Transformados</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="text-2xl font-bold">{trainer.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Avaliação Média</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Sobre {trainer.full_name.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{trainer.bio}</p>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Especialidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {trainer.specialties?.map((spec: any, index: number) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <spec.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">{spec.label}</h4>
                      <p className="text-sm text-muted-foreground">{spec.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card className="glass border-primary/20 overflow-hidden sticky top-6">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Reservar Sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Selecione uma data
                  </p>
                  <div className="flex gap-2">
                    {calendarDays.map((date) => {
                      const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`
                            flex-1 p-3 rounded-xl text-center transition-all
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                            }
                          `}
                        >
                          <p className="text-xs text-inherit opacity-70">
                            {format(date, 'EEE', { locale: pt })}
                          </p>
                          <p className="text-lg font-bold">{format(date, 'd')}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Time Slots */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Horários Disponíveis
                  </p>
                  <div className="space-y-2">
                    {MOCK_TIME_SLOTS.map((slot, index) => {
                      const isSelected = selectedSlot === slot.time;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot.time)}
                          disabled={!slot.available}
                          className={`
                            w-full flex items-center justify-between p-3 rounded-xl transition-all
                            ${isSelected 
                              ? 'bg-primary/20 border-primary text-primary' 
                              : slot.available
                                ? 'bg-white/5 border-white/10 hover:border-primary/30'
                                : 'bg-muted/20 text-muted-foreground cursor-not-allowed'
                            }
                            border
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm">{slot.time}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Book Button */}
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
                  disabled={!selectedSlot}
                  onClick={handleBookSession}
                >
                  Reservar Sessão
                </Button>

                {/* Premium Perk */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Membros Premium recebem <span className="text-primary font-medium">2 sessões gratuitas</span> por mês com Master Trainers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TrainerProfile;
