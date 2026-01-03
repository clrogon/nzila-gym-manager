import { RefreshCw, WifiOff } from 'lucide-react';

const sharedStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

export default function Offline() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <style>{sharedStyles}</style>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-muted/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-muted/30 rounded-full blur-xl" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border border-muted/30">
              <WifiOff className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Sem Ligação à Internet
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              Não foi possível conectar ao servidor
            </p>
            <p className="text-base text-muted-foreground/80 max-w-lg mx-auto">
              Verifique a sua ligação à internet e tente novamente. Algumas funcionalidades podem não estar disponíveis offline.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="max-w-md mx-auto bg-muted/30 rounded-xl p-6 text-left space-y-3">
          <h3 className="font-semibold text-sm">Sugestões:</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Verifique se o Wi-Fi ou dados móveis estão ativos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Tente desligar e ligar novamente a ligação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Contacte o seu fornecedor de internet se o problema persistir</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Reconectar
          </button>
        </div>
      </div>
    </div>
  );
}
