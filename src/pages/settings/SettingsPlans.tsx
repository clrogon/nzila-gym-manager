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
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';
import { Trash2, AlertCircle, CreditCard } from 'lucide-react';

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
  const { hasMinimumRole } = useRBAC();
  
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('30');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlanId) {
        const { error } = await supabase
          .from('membership_plans')
          .update({
            name: planName,
            description: planDescription || null,
            price: parseFloat(planPrice),
            duration_days: parseInt(planDuration),
          })
          .eq('id', editingPlanId);

        if (error) throw error;
        toast({ title: 'Plano Atualizado', description: 'O plano de subscrição foi atualizado.' });
      } else {
        const { error } = await supabase.from('membership_plans').insert({
          gym_id: gymId,
          name: planName,
          description: planDescription || null,
          price: parseFloat(planPrice),
          duration_days: parseInt(planDuration),
        });

        if (error) throw error;
        toast({ title: 'Plano Adicionado', description: 'Novo plano de subscrição foi criado.' });
      }

      resetForm();
      refresh();
    } catch (error) {
      console.error('Erro ao guardar plano:', error);
      toast({ title: 'Erro', description: 'Falha ao guardar plano.', variant: 'destructive' });
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice(plan.price.toString());
    setPlanDuration(plan.duration_days.toString());
  };

  const toggleStatus = async (plan: MembershipPlan) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast({ title: plan.is_active ? 'Plano Desativado' : 'Plano Ativado' });
      refresh();
    } catch (error) {
      console.error('Erro ao atualizar estado do plano:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar estado.', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este plano?')) return;
    
    try {
      const { error } = await supabase.from('membership_plans').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Plano Eliminado' });
      refresh();
    } catch (error) {
      console.error('Erro ao eliminar plano:', error);
      toast({ title: 'Erro', description: 'Falha ao eliminar plano.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanDuration('30');
  };

  return (
    <div className="space-y-6">
      <RequirePermission 
        minimumRole="admin" 
        fallback={
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Apenas Leitura</AlertTitle>
            <AlertDescription>
              Pode ver os planos de subscrição mas precisa de acesso de administrador para modificá-los.
            </AlertDescription>
          </Alert>
        }
      >
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Breve descrição"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (AOA) *</Label>
                  <Input
                    type="number"
                    placeholder="15000"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (Dias) *</Label>
                  <Select value={planDuration} onValueChange={setPlanDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias (Semanal)</SelectItem>
                      <SelectItem value="14">14 dias (Quinzenal)</SelectItem>
                      <SelectItem value="30">30 dias (Mensal)</SelectItem>
                      <SelectItem value="90">90 dias (Trimestral)</SelectItem>
                      <SelectItem value="180">180 dias (Semestral)</SelectItem>
                      <SelectItem value="365">365 dias (Anual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingPlanId ? 'Atualizar Plano' : 'Adicionar Plano'}
                </Button>
                {editingPlanId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </RequirePermission>

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
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
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

                  <RequirePermission minimumRole="admin">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(plan)}
                      >
                        {plan.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(plan)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => remove(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </RequirePermission>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ainda sem planos de subscrição. Adicione o seu primeiro plano acima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
