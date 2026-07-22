import { AlertTriangle, ArrowRight, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';

interface Props {
  colaboradoresAtivos: number;
  onConfigurarCargo: () => void;
  onAnalisarFuncoes: () => void;
}

/**
 * Alerta compacto de implantação (sem cargos estruturados). Não bloqueia a
 * consulta da lista de colaboradores; apenas contextualiza e oferece ações reais.
 */
export function JobEmployeesSetupAlert({ colaboradoresAtivos, onConfigurarCargo, onAnalisarFuncoes }: Props) {
  return (
    <div className="rounded-xl border border-status-warning/30 bg-status-warning/[0.06] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Estrutura de cargos ainda não configurada</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatNumberBR(colaboradoresAtivos)} colaboradores ativos foram encontrados, porém nenhum cargo estruturado
              está disponível para enquadramento. Os registros atuais continuam utilizando <strong className="text-foreground">função</strong> e
              <strong className="text-foreground"> setor</strong> do cadastro de RH.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" onClick={onConfigurarCargo}>Configurar primeiro cargo <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={onAnalisarFuncoes}><GitCompareArrows className="mr-1.5 h-4 w-4" /> Analisar funções existentes</Button>
        </div>
      </div>
    </div>
  );
}
