import { Check, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type MatrixCellState = 'total' | 'concedido' | 'negado';

interface Props { state: MatrixCellState; desconhecida?: boolean }

const META: Record<MatrixCellState, { icon: typeof Check; cls: string; label: string }> = {
  total: { icon: ShieldCheck, cls: 'text-[#7a5f16]', label: 'Acesso total (admin)' },
  concedido: { icon: Check, cls: 'text-success', label: 'Concedido' },
  negado: { icon: X, cls: 'text-muted-foreground/40', label: 'Negado' },
};

export function AccessMatrixCell({ state, desconhecida }: Props) {
  const m = META[state];
  const Icon = m.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center gap-1">
          <Icon className={cn('h-4 w-4', m.cls)} />
          {desconhecida && <AlertTriangle className="h-3 w-3 text-status-warning" />}
        </span>
      </TooltipTrigger>
      <TooltipContent>{m.label}{state === 'concedido' ? ' (via seções do usuário)' : ''}</TooltipContent>
    </Tooltip>
  );
}
