// src/modules/gdpr/GDPRCompliance.tsx
// STUB: GDPR features require additional database tables (user_consents, data_export_requests, deletion_requests)
// These will be implemented when the necessary schema is added

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

// Placeholder components until database tables are created
export function ConsentManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gestão de Consentimentos
        </CardTitle>
        <CardDescription>
          Gerencie suas preferências de privacidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Em Desenvolvimento</AlertTitle>
          <AlertDescription>
            A gestão de consentimentos GDPR será disponibilizada em breve.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function DataExportRequest() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Dados</CardTitle>
        <CardDescription>
          Solicite uma cópia dos seus dados pessoais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Em Desenvolvimento</AlertTitle>
          <AlertDescription>
            A exportação de dados será disponibilizada em breve.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function DataDeletionRequest() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apagar Dados</CardTitle>
        <CardDescription>
          Solicite a exclusão dos seus dados pessoais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Em Desenvolvimento</AlertTitle>
          <AlertDescription>
            A exclusão de dados será disponibilizada em breve.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function GDPRComplianceDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Privacidade e GDPR</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <ConsentManagement />
        <DataExportRequest />
      </div>
      <DataDeletionRequest />
    </div>
  );
}

export default GDPRComplianceDashboard;
