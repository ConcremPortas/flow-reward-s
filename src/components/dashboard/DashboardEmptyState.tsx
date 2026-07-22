import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardEmptyStateProps {
  onRetry?: () => void;
}

/** Sem dados carregados (base vazia ou falha de carregamento). */
export function DashboardEmptyState({ onRetry }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
        <Database className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">Sem dados para exibir</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Não há funcionários ou resultados de premiação carregados para os filtros atuais.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
