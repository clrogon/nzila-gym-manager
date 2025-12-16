import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Lock, Calendar } from 'lucide-react';

interface Gym {
  name: string;
  id: string;
}

interface SettingsSecurityProps {
  gym?: Gym;
}

export default function SettingsSecurity({ gym }: SettingsSecurityProps) {
  // Placeholder static data (replace with real queries later)
  const lastSettingsChange = new Date('2025-12-01T10:30:00');
  const lastLogin = new Date('2025-12-15T09:15:00');
  const adminCount = 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança & Auditoria</CardTitle>
        <CardDescription>
          Novas funcionalidades virão em breve. Aqui poderá consultar o histórico e controlar acessos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <p>Política de acesso e permissões será implementada em breve.</p>
        </div>

        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <p>
            Última alteração de definições: <strong>{lastSettingsChange.toLocaleString()}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <p>
            Administradores com acesso completo: <strong>{adminCount}</strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Mais funcionalidades de auditoria, logs e controlo de acessos estarão disponíveis em breve.
        </p>
      </CardContent>
    </Card>
  );
}
