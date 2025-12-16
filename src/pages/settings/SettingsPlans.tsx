import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  is_active: boolean;
}

interface SettingsPlansProps {
  plans: MembershipPlan[];
  refresh: () => Promise<void>;
  currency: string;
  gymId: string;
  defaultDuration?: number;
}

export default function SettingsPlans({ plans, refresh, currency, gymId, defaultDuration = 30 }: SettingsPlansProps) {
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState(defaultDuration);

  useEffect(() => {
    setNewPlanDuration(defaultDuration);
  }, [defaultDuration]);

  const handleCreatePlan = async () => {
    if (!newPlanName || newPlanPrice <= 0) return;

    try {
      await supabase.from('membership_plans').insert({
        gym_id: gymId,
        name: newPlanName,
        price: newPlanPrice,
        duration_days: newPlanDuration,
        is_active: true,
      });
      await refresh();
      setNewPlanName('');
      setNewPlanPrice(0);
      setNewPlanDuration(defaultDuration);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Adicionar Novo Plano</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          placeholder="Nome do Plano"
          value={newPlanName}
          onChange={(e) => setNewPlanName(e.target.value)}
        />
        <Input
          type="number"
          placeholder={`Preço (${currency})`}
          value={newPlanPrice}
          onChange={(e) => setNewPlanPrice(+e.target.value)}
        />
        <Input
          type="number"
          placeholder="Duração (dias)"
          value={newPlanDuration}
          onChange={(e) => setNewPlanDuration(+e.target.value)}
        />
      </div>
      <Button onClick={handleCreatePlan}>Criar Plano</Button>
    </div>
  );
}
