import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    let message = "Ocorreu um erro inesperado.";
    
    try {
      if (error.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('permissions')) {
          message = "Você não tem permissão para realizar esta ação ou acessar estes dados.";
        }
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Ops! Algo deu errado</h2>
        <p className="text-slate-600 max-w-md">
          {message}
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Recarregar Aplicativo
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

