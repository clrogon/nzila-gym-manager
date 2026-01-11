import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  Trash2, 
  AlertCircle, 
  CreditCard, 
  Loader2, 
  Edit, 
  X, 
  Plus,
  Sparkles,
  Check,
  Clock
} from 'lucide-react';

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
}

interface SettingsPlansProps {
  plans: MembershipPlan[];
  refresh: () => void;
  currency: string;
  gymId: string;
}

export default function SettingsPlans({ plans, refresh, currency, gymId }: SettingsPlansProps) {
  const { toast } = useToast();
  const { hasPermission, hasMinimumRole } = useRBAC();
  
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('30');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canEdit = hasMinimumRole('admin');
  const canCreate = hasPermission('settings:update');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency }).format(amount);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!planName.trim()) {
      newErrors.planName = 'Nome é obrigatório';
    } else if (planName.trim().length < 2) {
      newErrors.planName = 'Nome deve ter pelo menos 2 caracteres';
    } else if (planName.trim().length > 100) {
      newErrors.planName = 'Nome não pode exceder 100 caracteres';
    }

    const price = parseFloat(planPrice);
    if (isNaN(price) || price <= 0) {
      newErrors.planPrice = 'Preço deve ser maior que zero';
    } else if (price > 10000000) {
      newErrors.planPrice = 'Preço não pode exceder 10.000.000';
    }

    const duration = parseInt(planDuration, 10);
    if (isNaN(duration) || duration < 1 || duration > 3650) {
      newErrors.planDuration = 'Duração deve estar entre 1 e 3650 dias';
    }

    if (planDescription.trim().length > 500) {
      newErrors.planDescription = 'Descrição não pode exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreate) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Não tem permissão para criar/editar planos.',
        variant: 'destructive' 
      });
      return;
    }

    if (!validateForm()) {
      toast({ 
        title: 'Erro de Validação', 
        description: 'Por favor corrija os erros antes de guardar.',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const planData = {
        name: planName.trim(),
        description: planDescription.trim() || null,
        price: parseFloat(planPrice),
        duration_days: parseInt(planDuration, 10),
      };

      if (editingPlanId) {
        const { error } = await supabase
          .from('membership_plans')
          .update(planData)
          .eq('id', editingPlanId);

        if (error) throw error;
        toast({ title: 'Plano Atualizado', description: 'O plano de subscrição foi atualizado.' });
      } else {
        const { error } = await supabase
          .from('membership_plans')
          .insert({
            ...planData,
            gym_id: gymId,
            is_active: true,
          });

        if (error) throw error;
        toast({ title: 'Plano Adicionado', description: 'Novo plano de subscrição foi criado.' });
      }

      resetForm();
      refresh();
    } catch (error: any) {
      console.error('Plan save failed:', error?.message);
      toast({ 
        title: 'Erro ao Guardar', 
        description: 'Ocorreu um erro. Por favor tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    if (!canEdit) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Não tem permissão para editar planos.',
        variant: 'destructive' 
      });
      return;
    }

    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice(plan.price.toString());
    setPlanDuration(plan.duration_days.toString());
    setErrors({});
  };

  const toggleStatus = async (plan: MembershipPlan) => {
    if (!canEdit) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Não tem permissão para modificar planos.',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast({ title: plan.is_active ? 'Plano Desativado' : 'Plano Ativado' });
      refresh();
    } catch (error: any) {
      console.error('Toggle status failed:', error?.message);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao atualizar estado.',
        variant: 'destructive' 
      });
    }
  };

  const remove = async (id: string, name: string) => {
    if (!canEdit) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Não tem permissão para eliminar planos.',
        variant: 'destructive' 
      });
      return;
    }

    if (!confirm(`Tem a certeza que deseja eliminar o plano "${name}"? Esta ação não pode ser revertida.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Plano Eliminado', description: 'O plano foi removido com sucesso.' });
      refresh();
    } catch (error: any) {
      console.error('Delete plan failed:', error?.message);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao eliminar plano. Verifique se não há membros associados.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanDuration('30');
    setErrors({});
  };

  const getDurationLabel = (days: number) => {
    if (days === 1) return 'Diário';
    if (days === 7) return 'Semanal';
    if (days === 14) return 'Quinzenal';
    if (days === 30) return 'Mensal';
    if (days === 90) return 'Trimestral';
    if (days === 180) return 'Semestral';
    if (days === 365) return 'Anual';
    return `${days} dias`;
  };

  const inputClassName = 'bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200';

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert className="border-border/50 bg-muted/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Apenas Leitura</AlertTitle>
          <AlertDescription>
            Pode ver os planos de subscrição mas precisa de acesso de administrador para modificá-los.
          </AlertDescription>
        </Alert>
      )}

      {canCreate && (
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">
                  {editingPlanId ? 'Editar Plano' : 'Adicionar Plano de Subscrição'}
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  {editingPlanId ? 'Atualize os detalhes do plano' : 'Crie um novo plano para o seu ginásio'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Plano *</Label>
                  <Input
                    placeholder="ex: Mensal Premium"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    disabled={loading}
                    className={inputClassName}
                  />
                  {errors.planName && (
                    <p className="text-xs text-destructive">{errors.planName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <Input
                    placeholder="Breve descrição do plano"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    disabled={loading}
                    className={inputClassName}
                  />
                  {errors.planDescription && (
                    <p className="text-xs text-destructive">{errors.planDescription}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preço ({currency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15000"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    disabled={loading}
                    className={inputClassName}
                  />
                  {errors.planPrice && (
                    <p className="text-xs text-destructive">{errors.planPrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duração *</Label>
                  <Select 
                    value={planDuration} 
                    onValueChange={setPlanDuration}
                    disabled={loading}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 dia (Teste)</SelectItem>
                      <SelectItem value="7">7 dias (Semanal)</SelectItem>
                      <SelectItem value="14">14 dias (Quinzenal)</SelectItem>
                      <SelectItem value="30">30 dias (Mensal)</SelectItem>
                      <SelectItem value="90">90 dias (Trimestral)</SelectItem>
                      <SelectItem value="180">180 dias (Semestral)</SelectItem>
                      <SelectItem value="365">365 dias (Anual)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.planDuration && (
                    <p className="text-xs text-destructive">{errors.planDuration}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:glow-gold transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingPlanId ? 'A atualizar...' : 'A adicionar...'}
                    </>
                  ) : (
                    <>
                      {editingPlanId ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {editingPlanId ? 'Atualizar Plano' : 'Adicionar Plano'}
                    </>
                  )}
                </Button>
                {editingPlanId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={loading}
                    className="border-border/50 hover:bg-muted/50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">Planos Atuais</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                {plans.length} planos configurados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {plans.length > 0 ? (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="group flex items-center justify-between p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/20 hover:bg-muted/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-14 rounded-full transition-colors ${plan.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base">{plan.name}</p>
                        {!plan.is_active && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getDurationLabel(plan.duration_days)}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(plan)}
                        disabled={loading}
                        className="hover:bg-muted"
                      >
                        {plan.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(plan)}
                        disabled={loading}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(plan.id, plan.name)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <p className="text-muted-foreground mb-2">
                Ainda sem planos de subscrição
              </p>
              <p className="text-sm text-muted-foreground/70">
                {canCreate ? 'Adicione o seu primeiro plano acima.' : 'Contacte um administrador para adicionar planos.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
