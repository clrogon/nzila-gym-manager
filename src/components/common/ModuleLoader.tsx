import { Spinner } from 'flowbite-react';

interface ModuleLoaderProps {
  message?: string;
}

export function ModuleLoader({ message = 'Loading...' }: ModuleLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <Spinner size="xl" color="info" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

export default ModuleLoader;
