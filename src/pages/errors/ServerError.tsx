import { Home, RefreshCw, Server, Mail, Bug } from 'lucide-react';

const sharedStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

export default function ServerError() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <style>{sharedStyles}</style>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center border border-destructive/20">
              <Server className="w-16 h-16 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Erro no Servidor
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              Algo correu mal do nosso lado
            </p>
            <p className="text-base text-muted-foreground/80 max-w-lg mx-auto">
              Estamos a trabalhar para resolver o problema. Por favor, tente novamente dentro de alguns minutos.
            </p>
          </div>
        </div>

        {/* Error Code */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-mono">
          <Bug className="w-4 h-4" />
          <span>Código de Erro: 500</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
          
          <button
            onClick={handleHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg"
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </button>
        </div>

        {/* Support */}
        <div className="pt-8 border-t border-border/50 space-y-2">
          <p className="text-sm text-muted-foreground">
            Se o problema persistir, contacte-nos:
          </p>
          <a 
            href="mailto:suporte@nzila.ao"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="w-4 h-4" />
            suporte@nzila.ao
          </a>
        </div>
      </div>
    </div>
  );
}
