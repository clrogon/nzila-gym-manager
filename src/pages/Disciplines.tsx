import { useState, useEffect } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Discipline {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
}

interface Plan {
  id: string;
  name: string;
  type: string;
  disciplines: Discipline[];
  familyPlan?: boolean;
}

export default function Settings() {
  const { currentGym } = useGym();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentGym?.id) fetchDisciplines();
  }, [currentGym?.id]);

  const fetchDisciplines = async () => {
    if (!currentGym?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('gym_id', currentGym.id)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setDisciplines(data || []);
      generatePlans(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Falha ao carregar disciplinas');
    } finally {
      setLoading(false);
    }
  };

  const generatePlans = (disciplineList: Discipline[]) => {
    const newPlans: Plan[] = [];

    // 1. Individual Plans
    disciplineList.forEach(d => {
      newPlans.push({
        id: `plan-ind-${d.id}`,
        name: `${d.name} Individual`,
        type: 'Individual',
        disciplines: [d],
      });
    });

    // 2. Family Plans (2-3 disciplines combinadas)
    if (disciplineList.length >= 2) {
      for (let i = 0; i < disciplineList.length - 1; i++) {
        for (let j = i + 1; j < disciplineList.length; j++) {
          newPlans.push({
            id: `plan-family-${i}-${j}`,
            name: `Plano Familiar: ${disciplineList[i].name} + ${disciplineList[j].name}`,
            type: 'Family',
            disciplines: [disciplineList[i], disciplineList[j]],
            familyPlan: true,
          });
        }
      }
    }

    // 3. Category Plans
    const categories = Array.from(new Set(disciplineList.map(d => d.category).filter(Boolean)));
    categories.forEach(cat => {
      const catDisciplines = disciplineList.filter(d => d.category === cat);
      newPlans.push({
        id: `plan-cat-${cat}`,
        name: `Categoria: ${cat}`,
        type: 'Category',
        disciplines: catDisciplines,
      });
    });

    // 4. Multi-discipline plans (3 disciplinas combinadas)
    if (disciplineList.length >= 3) {
      for (let i = 0; i < disciplineList.length - 2; i++) {
        for (let j = i + 1; j < disciplineList.length - 1; j++) {
          for (let k = j + 1; k < disciplineList.length; k++) {
            newPlans.push({
              id: `plan-multi-${i}-${j}-${k}`,
              name: `Treino Completo: ${disciplineList[i].name} + ${disciplineList[j].name} + ${disciplineList[k].name}`,
              type: 'Multi-Discipline',
              disciplines: [disciplineList[i], disciplineList[j], disciplineList[k]],
            });
          }
        }
      }
    }

    // 5. VIP Plan
    newPlans.push({
      id: 'plan-vip',
      name: 'VIP: Todas as Disciplinas',
      type: 'VIP',
      disciplines: disciplineList,
    });

    setPlans(newPlans);
  };

  if (!currentGym) return <p>Selecione um ginásio primeiro.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Planos Disponíveis</h1>
      {loading ? (
        <p>Carregando planos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {plan.disciplines.map(d => (
                  <div key={d.id} className="flex items-center justify-between">
                    <span>{d.name}</span>
                    <Switch checked={d.is_active} />
                  </div>
                ))}
              </CardContent>
              {plan.familyPlan && <Badge>Plano Familiar</Badge>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
