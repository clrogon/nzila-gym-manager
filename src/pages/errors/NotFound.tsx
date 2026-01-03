import { Home, ArrowLeft, Search } from 'lucide-react';

const sharedStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-gradient {
    background-size: 200% auto;
    animation: gradient-shift 3s ease infinite;
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

export default function NotFound() {
  const handleBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <style>{sharedStyles}</style>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '700ms' }} />
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Large 404 */}
        <div className="relative">
          <h1 className="text-9xl md:text-[12rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-24 h-24 text-muted-foreground/20" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Página Não Encontrada
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            A página que procura não existe ou foi movida. Verifique o endereço ou regresse à página inicial.
          </p>
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
            onClick={handleHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity font-medium shadow-lg"
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </button>
        </div>

        {/* Help text */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda?{' '}
            <a href="mailto:suporte@nzila.ao" className="text-primary hover:underline">
              Contacte o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
