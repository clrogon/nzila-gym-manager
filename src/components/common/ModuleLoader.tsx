import { Loader2 } from 'lucide-react';

interface ModuleLoaderProps {
  message?: string;
}

/**
 * Module Loader Component
 * Simple loading spinner using lucide-react (removed flowbite dependency)
 */
export function ModuleLoader({ message = 'Loading...' }: ModuleLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

export default ModuleLoader;
