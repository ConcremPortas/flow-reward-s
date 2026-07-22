import { GitCompare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { pluralizeBR } from '@/lib/formatters';
import type { SimilarityGroup } from '../types/function.types';

interface Props {
  group: SimilarityGroup;
  onCompare: (idA: string, idB: string) => void;
  onOpenFuncao: (id: string) => void;
}

/** Card de um grupo de funções semelhantes (possível correspondência). */
export function FunctionSimilarityGroup({ group, onCompare, onOpenFuncao }: Props) {
  return (
    <div className="rounded-xl border border-status-warning/30 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge variant="warning">
          {group.confidence === 'high' ? 'Possível correspondência' : 'Nome semelhante'}
        </StatusBadge>
        {group.members.length >= 2 && (
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => onCompare(group.members[0].id, group.members[1].id)}>
            <GitCompare className="h-3.5 w-3.5" /> Comparar
          </Button>
        )}
      </div>

      <ul className="mt-3 space-y-1.5">
        {group.members.map(m => (
          <li key={m.id}>
            <button type="button" onClick={() => onOpenFuncao(m.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">{m.nome}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {pluralizeBR(m.funcionarios, 'funcionário', 'funcionários')}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {group.diffs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Diferenças:</span>
          {group.diffs.map(d => <span key={d} className="rounded-full bg-status-warning/10 px-2 py-0.5 text-[11px] font-medium text-status-warning">{d}</span>)}
        </div>
      )}
    </div>
  );
}
