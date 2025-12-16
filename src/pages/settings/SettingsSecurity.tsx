import { ShieldAlert } from 'lucide-react';

export default function SettingsSecurity() {
  return (
    <div className="border rounded-lg p-8 text-center space-y-4">
      <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Segurança & Acessos</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Funcionalidades avançadas de segurança, permissões de utilizadores e
        auditoria estarão disponíveis brevemente.
      </p>
      <p className="text-sm text-muted-foreground">
        Em desenvolvimento 🚧
      </p>
    </div>
  );
}
