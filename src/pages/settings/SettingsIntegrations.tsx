
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsIntegrations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" disabled>Multicaixa (Coming soon)</Button>
        <Button variant="outline" disabled>Google Calendar (Coming soon)</Button>
        <Button variant="outline" disabled>WhatsApp Business (Coming soon)</Button>
      </CardContent>
    </Card>
  );
}
