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
import { Trash2, AlertCircle, CreditCard, Loader2, Edit, X } from 'lucide-react';

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

    // Plan name validation
    if (!planName.trim()) {
      newErrors.planName = 'Nome é obrigatório';
    } else if (planName.trim().length < 2) {
      newErrors.planName = 'Nome deve ter pelo menos 2 caracteres';
    } else if (planName.trim().length > 100) {
      newErrors.planName = 'Nome não pode exceder 100 caracteres';
    }

    // Price validation
    const price = parseFloat(planPrice);
    if (isNaN(price) || price <= 0) {
      newErrors.planPrice = 'Preço deve ser maior que zero';
    } else if (price > 10000000) {
      newErrors.planPrice = 'Preço não pode exceder 10.000.000';
    }

    // Duration validation
    const duration = parseInt(planDuration, 10);
    if (isNaN(duration) || duration < 1 || duration > 3650) {
      newErrors.planDuration = 'Duração deve estar entre 1 e 3650 dias';
    }

    // Description validation (optional but max length)
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

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Apenas Leitura</AlertTitle>
          <AlertDescription>
            Pode ver os planos de subscrição mas precisa de acesso de administrador para modificá-los.
          </AlertDescription>
        </Alert>
      )}

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlanId ? 'Editar Plano' : 'Adicionar Plano de Subscrição'}</CardTitle>
            <CardDescription>
              {editingPlanId ? 'Atualize os detalhes do plano de subscrição' : 'Crie um novo plano de subscrição para o seu ginásio'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Plano *</Label>
                  <Input
                    placeholder="ex: Mensal Básico"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    disabled={loading}
                  />
                  {errors.planName && (
                    <p className="text-xs text-destructive">{errors.planName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Breve descrição"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    disabled={loading}
                  />
                  {errors.planDescription && (
                    <p className="text-xs text-destructive">{errors.planDescription}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Preço ({currency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15000"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    disabled={loading}
                  />
                  {errors.planPrice && (
                    <p className="text-xs text-destructive">{errors.planPrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Duração (Dias) *</Label>
                  <Select 
                    value={planDuration} 
                    onValueChange={setPlanDuration}
                    disabled={loading}
                  >
                    <SelectTrigger>
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

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingPlanId ? 'A atualizar...' : 'A adicionar...'}
                    </>
                  ) : (
                    editingPlanId ? 'Atualizar Plano' : 'Adicionar Plano'
                  )}
                </Button>
                {editingPlanId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={loading}
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

      <Card>
        <CardHeader>
          <CardTitle>Planos Atuais</CardTitle>
          <CardDescription>Gerir os seus planos de subscrição existentes</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length > 0 ? (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{plan.name}</p>
                        {!plan.is_active && <Badge variant="secondary">Inativo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(plan.price)} · {plan.duration_days} dias
                      </p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(plan)}
                        disabled={loading}
                      >
                        {plan.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(plan)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
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
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Ainda sem planos de subscrição. {canCreate ? 'Adicione o seu primeiro plano acima.' : 'Contacte um administrador para adicionar planos.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
