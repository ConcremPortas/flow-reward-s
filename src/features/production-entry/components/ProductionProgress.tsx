import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPercentBR } from '@/lib/formatters';
import type { ProductionRow } from '../types/production-entry.types';

interface Props {
  previstos: number;
  apurados: number;
  pendentesRows: ProductionRow[];
  onShowPendentes: () => void;
}

/** Progresso da apuração da competência — X de Y setores preenchidos + pendentes. */
export function ProductionProgress({ previstos, apurados, pendentesRows, onShowPendentes }: Props) {
  const pct = previstos > 0 ? (apurados / previstos) * 100 : 0;
  const pendentes = pendentesRows.length;
  const amostra = pendentesRows.slice(0, 5);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {apurados} de {previstos} setores preenchidos
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercentBR(pct, 0)} concluído{pendentes > 0 ? ` · ${pendentes} pendente(s)` : ''}
          </p>
        </div>
        {pendentes > 0 && (
          <Button variant="outline" size="sm" className="h-8" onClick={onShowPendentes}>Ver todos os pendentes</Button>
        )}
      </div>

      <Progress value={Math.min(pct, 100)} className="mt-3 h-2" />

      {amostra.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {amostra.map((r) => (
            <span key={r.setorId} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{r.setorNome}</span>
          ))}
          {pendentes > amostra.length && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">+{pendentes - amostra.length}</span>
          )}
        </div>
      )}
    </div>
  );
}
