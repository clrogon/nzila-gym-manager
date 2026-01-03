
import { Home, ArrowLeft, ShieldOff, AlertTriangle } from 'lucide-react';

const sharedStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

export default function Forbidden() {
  const handleBack = () => {
    window.history.back();
  };

  const handleDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-warning/5 p-4">
      <style>{sharedStyles}</style>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-warning/20 rounded-full blur-xl" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center border border-warning/20">
              <ShieldOff className="w-16 h-16 text-warning" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Acesso Negado
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              Não tem permissão para aceder a esta página
            </p>
            <p className="text-base text-muted-foreground/80 max-w-lg mx-auto">
              Esta área requer permissões especiais. Se acredita que deveria ter acesso, contacte o administrador do sistema.
            </p>
          </div>
        </div>

        {/* Error Code */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning text-sm font-mono">
          <AlertTriangle className="w-4 h-4" />
          <span>Código de Erro: 403</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <button
            onClick={handleDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg"
          >
            <Home className="w-4 h-4" />
            Ir para Dashboard
          </button>
        </div>

        {/* Help */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Precisa de permissões adicionais?{' '}
            <a href="mailto:admin@nzila.ao" className="text-primary hover:underline">
              Contacte um administrador
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
