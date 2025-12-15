import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsIntegrations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" disabled>
          Multicaixa Express (coming soon)
        </Button>
        <Button variant="outline" disabled>
          Google Calendar (coming soon)
        </Button>
        <Button variant="outline" disabled>
          WhatsApp Business (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
}
