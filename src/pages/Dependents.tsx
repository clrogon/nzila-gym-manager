// src/pages/Dependents.tsx
// STUB: Dependents feature requires member_dependents table
// Will be fully implemented when database schema is added

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, AlertTriangle } from 'lucide-react';

export default function Dependents() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Dependentes</h1>
            <p className="text-muted-foreground">
              Gerencie os dependentes vinculados à sua conta
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestão de Dependentes</CardTitle>
            <CardDescription>
              Adicione e gerencie menores ou familiares vinculados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Em Desenvolvimento</AlertTitle>
              <AlertDescription>
                A funcionalidade de gestão de dependentes será disponibilizada em breve.
                Essa funcionalidade permitirá que você adicione dependentes (filhos, cônjuges, etc.)
                à sua conta e gerencie seus acessos ao ginásio.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
