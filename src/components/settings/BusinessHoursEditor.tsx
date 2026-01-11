import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Save, Loader2, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: '06:00', close: '22:00', closed: false },
  tuesday: { open: '06:00', close: '22:00', closed: false },
  wednesday: { open: '06:00', close: '22:00', closed: false },
  thursday: { open: '06:00', close: '22:00', closed: false },
  friday: { open: '06:00', close: '22:00', closed: false },
  saturday: { open: '08:00', close: '18:00', closed: false },
  sunday: { open: '09:00', close: '14:00', closed: false },
};

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

interface BusinessHoursEditorProps {
  gymId: string;
  gymSettings: Record<string, unknown>;
  canEdit: boolean;
  onSave: () => Promise<void>;
}

export function BusinessHoursEditor({ gymId, gymSettings, canEdit, onSave }: BusinessHoursEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);

  useEffect(() => {
    if (gymSettings?.business_hours) {
      setHours(gymSettings.business_hours as unknown as BusinessHours);
    }
  }, [gymSettings]);

  const updateDay = (day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    setHasChanges(true);
  };

  const copyToWeekdays = () => {
    const mondayHours = hours.monday;
    setHours(prev => ({
      ...prev,
      tuesday: { ...mondayHours },
      wednesday: { ...mondayHours },
      thursday: { ...mondayHours },
      friday: { ...mondayHours },
    }));
    setHasChanges(true);
    toast({ title: 'Copiado', description: 'Horário de segunda aplicado a todos os dias úteis.' });
  };

  const resetToDefaults = () => {
    if (confirm('Tem a certeza que deseja restaurar os horários padrão?')) {
      setHours(DEFAULT_HOURS);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      const newSettings = {
        ...gymSettings,
        business_hours: hours,
      } as unknown as Json;

      const { error } = await supabase
        .from('gyms')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq('id', gymId);

      if (error) throw error;

      await onSave();
      setHasChanges(false);
      toast({ title: 'Horário Guardado', description: 'O horário de funcionamento foi atualizado.' });
    } catch (error) {
      console.error('Failed to save business hours:', error);
      toast({ title: 'Erro', description: 'Falha ao guardar horário.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg hover:shadow-xl transition-all duration-500 group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-gold transition-all duration-300">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">Horário de Funcionamento</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Configure o horário de abertura e fecho do ginásio
              </CardDescription>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToWeekdays} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Copiar para dias úteis
              </Button>
              <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-3">
          {(Object.keys(hours) as (keyof BusinessHours)[]).map((day) => (
            <div 
              key={day}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                hours[day].closed 
                  ? 'bg-muted/30 opacity-60' 
                  : 'bg-muted/20 border border-border/30 hover:border-primary/20'
              }`}
            >
              <div className="w-32">
                <Label className="font-medium">{DAY_LABELS[day]}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={!hours[day].closed}
                  onCheckedChange={(checked) => updateDay(day, 'closed', !checked)}
                  disabled={!canEdit}
                />
                <span className="text-sm text-muted-foreground w-16">
                  {hours[day].closed ? 'Fechado' : 'Aberto'}
                </span>
              </div>
              
              {!hours[day].closed && (
                <div className="flex items-center gap-2 ml-4">
                  <Select
                    value={hours[day].open}
                    onValueChange={(value) => updateDay(day, 'open', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-24 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`open-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">às</span>
                  
                  <Select
                    value={hours[day].close}
                    onValueChange={(value) => updateDay(day, 'close', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-24 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`close-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>

        {canEdit && hasChanges && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
            <span className="text-sm text-primary animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Alterações não guardadas
            </span>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/90 hover:glow-gold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Horário
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
