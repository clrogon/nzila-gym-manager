import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useToast } from '@/hooks/use-toast';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
}

export default function SettingsPlans() {
  const { currentGym } = useGym();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');

  useEffect(() => {
    if (!currentGym) return;
    supabase
      .from('membership_plans')
      .select('*')
      .eq('gym_id', currentGym.id)
      .then(({ data }) => setPlans(data ?? []));
  }, [currentGym]);

  const add = async () => {
    const p = Number(price);
    const d = Number(duration);

    if (!Number.isFinite(p) || p <= 0 || !Number.isInteger(d)) {
      toast({ title: 'Invalid values', variant: 'destructive' });
      return;
    }

    await supabase.from('membership_plans').insert({
      gym_id: currentGym?.id,
      name,
      price: p,
      duration_days: d,
    });

    setName('');
    setPrice('');
    setDuration('30');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Plans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RequirePermission minimumRole="admin">
          <div className="grid md:grid-cols-3 gap-3">
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
            <Input placeholder="Days" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <Button onClick={add}>Add plan</Button>
        </RequirePermission>

        <div className="space-y-2">
          {plans.map(p => (
            <div key={p.id} className="flex justify-between border p-3 rounded">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.price} / {p.duration_days} days
                </p>
              </div>
              <Badge>{p.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
