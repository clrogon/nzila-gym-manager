import { Component, ErrorInfo, ReactNode } from 'react';
import { Home, RefreshCw, Frown, Mail } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

const sharedStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

// Generic Error Display Component
function GenericErrorDisplay({ 
  error, 
  onReset 
}: { 
  error?: Error; 
  onReset: () => void;
}) {
  const isDev = import.meta.env.DEV;

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <style>{sharedStyles}</style>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center border border-destructive/20">
              <Frown className="w-16 h-16 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Algo Correu Mal
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              Ocorreu um erro inesperado
            </p>
            <p className="text-base text-muted-foreground/80 max-w-lg mx-auto">
              Lamentamos o inconveniente. A nossa equipa foi notificada e está a trabalhar para resolver o problema.
            </p>
          </div>
        </div>

        {/* Error Details (dev mode only) */}
        {error && isDev && (
          <details className="max-w-lg mx-auto text-left">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Detalhes técnicos (apenas visível em desenvolvimento)
            </summary>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-mono text-destructive mb-2">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            onClick={onReset}
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
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda urgente?{' '}
            <a href="mailto:suporte@nzila.ao" className="text-primary hover:underline inline-flex items-center gap-1">
              <Mail className="w-3 h-3" />
              suporte@nzila.ao
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Error Boundary Class Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use the default error display
      return (
        <GenericErrorDisplay 
          error={this.state.error} 
          onReset={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
