import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI (removed flowbite dependency)
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.moduleName || 'module'}:`, error, errorInfo);
    
    // Log to monitoring service if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        moduleName: this.props.moduleName,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background rounded-lg border border-border">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {this.props.moduleName ? `${this.props.moduleName} Error` : 'Something went wrong'}
          </h2>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go to Dashboard
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 p-4 bg-muted rounded-md">
              <summary className="cursor-pointer text-sm font-medium">Error Details (Dev Only)</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
