import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';

export default function SettingsNotifications() {
  const { currentGym } = useGym();
  const [state, setState] = useState<any>({
    email: true,
    sms: false,
  });

  useEffect(() => {
    if (currentGym?.notification_settings) {
      setState(currentGym.notification_settings);
    }
  }, [currentGym]);

  const save = async () => {
    await supabase
      .from('gyms')
      .update({ notification_settings: state })
      .eq('id', currentGym?.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(state).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span>{k}</span>
            <Switch checked={!!v} onCheckedChange={val => setState(s => ({ ...s, [k]: val }))} />
          </div>
        ))}

        <RequirePermission permission="settings:update">
          <Button onClick={save}>
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </RequirePermission>
      </CardContent>
    </Card>
  );
}
