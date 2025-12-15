import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RequirePermission } from '@/components/common/RequirePermission';

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
}

export default function SettingsPlans({
  plans,
  refresh,
  currency,
}: {
  plans: MembershipPlan[];
  refresh: () => void;
  currency: string;
}) {
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency }).format(amount);

  const toggleStatus = async (plan: MembershipPlan) => {
    await supabase
      .from('membership_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);

    toast({ title: 'Plan updated' });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await supabase.from('membership_plans').delete().eq('id', id);
    toast({ title: 'Plan deleted' });
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Plans</CardTitle>
        <CardDescription>Manage pricing and availability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className="flex justify-between border p-3 rounded">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(plan.price)} · {plan.duration_days} days
              </p>
              {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
            </div>

            <RequirePermission minimumRole="admin">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleStatus(plan)}>
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </RequirePermission>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
