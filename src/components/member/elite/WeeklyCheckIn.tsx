import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Scale,
  Ruler,
  Camera,
  Moon,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CheckInData {
  weight?: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  wellness: {
    sleep: number;
    energy: number;
    stress: number;
    motivation: number;
  };
  notes?: string;
  photos?: string[];
}

export function WeeklyCheckIn() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [checkInData, setCheckInData] = useState<CheckInData>({
    wellness: {
      sleep: 7,
      energy: 7,
      stress: 5,
      motivation: 8,
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current week range
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Fetch member data
  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member-profile', user?.id, currentGym?.id],
    queryFn: async () => {
      if (!user || !currentGym) return null;
      
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!currentGym,
  });

  // Fetch previous check-in for comparison
  const { data: previousCheckIn } = useQuery({
    queryKey: ['previous-checkin', memberData?.id],
    queryFn: async () => {
      if (!memberData?.id) return null;
      
      // In production, fetch from a check_ins_progress table
      // For now, return mock data
      return {
        weight: 75.5,
        bodyFat: 18,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    },
    enabled: !!memberData?.id,
  });

  const handleSubmit = async () => {
    if (!memberData?.id) return;
    
    setIsSubmitting(true);
    try {
      // In production, save to a progress_logs or check_ins_progress table
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Check-in Enviado!',
        description: 'O seu progresso foi registado com sucesso.',
      });
      
      navigate('/member/elite');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível guardar o check-in.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChangeIndicator = (current: number | undefined, previous: number | undefined) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: 'text-muted-foreground', value: '0' };
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', value: `+${diff.toFixed(1)}` };
    return { icon: TrendingDown, color: 'text-red-500', value: diff.toFixed(1) };
  };

  const weightChange = getChangeIndicator(checkInData.weight, previousCheckIn?.weight);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
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
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Calendar className="w-3 h-3 mr-1" />
              {format(weekStart, 'dd MMM', { locale: pt })} - {format(weekEnd, 'dd MMM', { locale: pt })}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Check-in <span className="text-gradient">Semanal</span>
          </h1>
          <p className="text-muted-foreground">
            Registe o seu progresso para partilhar com o seu treinador elite.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Physical Stats */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Estatísticas Físicas
              </CardTitle>
              <CardDescription>Registe as suas medidas desta semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    Peso (kg)
                  </Label>
                  {weightChange && (
                    <span className={`flex items-center gap-1 text-sm ${weightChange.color}`}>
                      <weightChange.icon className="w-3 h-3" />
                      {weightChange.value}
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.5"
                  value={checkInData.weight || ''}
                  onChange={(e) => setCheckInData(prev => ({ 
                    ...prev, 
                    weight: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
                {previousCheckIn && (
                  <p className="text-xs text-muted-foreground">
                    Semana anterior: {previousCheckIn.weight} kg
                  </p>
                )}
              </div>

              {/* Body Fat */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  Gordura Corporal (%)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 18.5"
                  value={checkInData.bodyFat || ''}
                  onChange={(e) => setCheckInData(prev => ({ 
                    ...prev, 
                    bodyFat: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  className="bg-white/5 border-white/10 focus:border-primary"
                />
              </div>

              <Separator className="bg-white/10" />

              {/* Measurements */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Medidas Corporais (cm)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'chest', label: 'Peito' },
                    { key: 'waist', label: 'Cintura' },
                    { key: 'hips', label: 'Anca' },
                    { key: 'arms', label: 'Braços' },
                  ].map((measurement) => (
                    <div key={measurement.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{measurement.label}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        value={(checkInData.measurements as any)?.[measurement.key] || ''}
                        onChange={(e) => setCheckInData(prev => ({ 
                          ...prev, 
                          measurements: {
                            ...prev.measurements,
                            [measurement.key]: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                        className="bg-white/5 border-white/10 focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wellness & Photos */}
          <div className="space-y-6">
            {/* Progress Photos */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Fotos de Progresso
                </CardTitle>
                <CardDescription>Compare a sua evolução visual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {['Frente', 'Lado', 'Costas'].map((view, index) => (
                    <button
                      key={view}
                      className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-white/5"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{view}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Toque para carregar fotos • Visíveis apenas para si e o seu treinador
                </p>
              </CardContent>
            </Card>

            {/* Wellness Metrics */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Bem-Estar
                </CardTitle>
                <CardDescription>Como se sentiu esta semana?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sleep */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-blue-400" />
                      Qualidade do Sono
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {checkInData.wellness.sleep}/10
                    </span>
                  </div>
                  <Slider
                    value={[checkInData.wellness.sleep]}
                    onValueChange={([value]) => setCheckInData(prev => ({
                      ...prev,
                      wellness: { ...prev.wellness, sleep: value }
                    }))}
                    max={10}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {/* Energy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Níveis de Energia
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {checkInData.wellness.energy}/10
                    </span>
                  </div>
                  <Slider
                    value={[checkInData.wellness.energy]}
                    onValueChange={([value]) => setCheckInData(prev => ({
                      ...prev,
                      wellness: { ...prev.wellness, energy: value }
                    }))}
                    max={10}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {/* Stress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-400" />
                      Nível de Stress
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {checkInData.wellness.stress}/10
                    </span>
                  </div>
                  <Slider
                    value={[checkInData.wellness.stress]}
                    onValueChange={([value]) => setCheckInData(prev => ({
                      ...prev,
                      wellness: { ...prev.wellness, stress: value }
                    }))}
                    max={10}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {/* Motivation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Motivação
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {checkInData.wellness.motivation}/10
                    </span>
                  </div>
                  <Slider
                    value={[checkInData.wellness.motivation]}
                    onValueChange={([value]) => setCheckInData(prev => ({
                      ...prev,
                      wellness: { ...prev.wellness, motivation: value }
                    }))}
                    max={10}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notes Section */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Notas para o Treinador
            </CardTitle>
            <CardDescription>Partilhe qualquer informação relevante sobre a sua semana</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Senti dores no ombro após o treino de terça-feira..."
              value={checkInData.notes || ''}
              onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-white/5 border-white/10 focus:border-primary min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-brand-accent text-primary-foreground px-8"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>A Enviar...</>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Check-in
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WeeklyCheckIn;
