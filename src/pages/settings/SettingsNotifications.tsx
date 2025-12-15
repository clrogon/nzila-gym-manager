import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsNotifications({ state, onChange, canSave }: any) {
  const { toast } = useToast();

  const save = () => toast({ title: 'Notification settings saved' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SwitchRow label="Email notifications" checked={state.emailNotifications} onChange={onChange.setEmailNotifications} />
        <SwitchRow label="SMS notifications" checked={state.smsNotifications} onChange={onChange.setSmsNotifications} />
        <SwitchRow label="Membership reminders" checked={state.membershipReminders} onChange={onChange.setMembershipReminders} />
        <SwitchRow label="Payment reminders" checked={state.paymentReminders} onChange={onChange.setPaymentReminders} />

        {canSave && (
          <Button onClick={save}>
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SwitchRow({ label, checked, onChange }: any) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
