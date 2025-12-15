import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useToast } from '@/hooks/use-toast';

type GymSettingsState = {
  name: string;
  phone: string;
  address: string;
  email: string;
  timezone: string;
  currency: string;
  logoUrl: string;
};

export default function SettingsGeneral() {
  const { currentGym, refreshGyms } = useGym();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<GymSettingsState>({
    name: '',
    phone: '',
    address: '',
    email: '',
    timezone: 'Africa/Luanda',
    currency: 'AOA',
    logoUrl: '',
  });

  useEffect(() => {
    if (!currentGym) return;
    setState({
      name: currentGym.name,
      phone: currentGym.phone || '',
      address: currentGym.address || '',
      email: currentGym.email || '',
      timezone: currentGym.timezone || 'Africa/Luanda',
      currency: currentGym.currency || 'AOA',
      logoUrl: currentGym.logo_url || '',
    });
  }, [currentGym]);

  const save = async () => {
    if (!currentGym) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          name: state.name,
          phone: state.phone,
          address: state.address,
          email: state.email,
          timezone: state.timezone,
          currency: state.currency,
          logo_url: state.logoUrl || null,
        })
        .eq('id', currentGym.id);

      if (error) throw error;

      await refreshGyms();
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gym Information</CardTitle>
        <CardDescription>Identity and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Logo URL</Label>
          <Input
            value={state.logoUrl}
            onChange={e => setState(s => ({ ...s, logoUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <Separator />

        <div className="grid md:grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'address'].map(key => (
            <div key={key}>
              <Label className="capitalize">{key}</Label>
              <Input
                value={(state as any)[key]}
                onChange={e => setState(s => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <RequirePermission permission="settings:update">
          <Button onClick={save} disabled={loading}>
            <Save className="w-4 h-4 mr-2" /> Save changes
          </Button>
        </RequirePermission>
      </CardContent>
    </Card>
  );
}
