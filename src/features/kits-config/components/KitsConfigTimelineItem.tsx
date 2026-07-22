import { formatCurrencyBRL, formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { canEditConfig, canDeleteConfig } from '../domain/kitsConfigStatus';
import { KitsConfigStatus } from './KitsConfigStatus';
import { KitsConfigActionsMenu } from './KitsConfigActionsMenu';
import { periodLabel, vigenciaLabel } from './periodLabel';
import type { KitsConfigRow } from '../types/kits-config.types';

export interface KitsConfigRowHandlers {
  onOpen: (r: KitsConfigRow) => void;
  onSimular: (r: KitsConfigRow) => void;
  onEdit: (r: KitsConfigRow) => void;
  onComparar: (r: KitsConfigRow) => void;
  onNovaVigencia: (r: KitsConfigRow) => void;
  onVerUtilizacao: (r: KitsConfigRow) => void;
  onDelete: (r: KitsConfigRow) => void;
}

export function KitsConfigTimelineItem({ row, handlers }: { row: KitsConfigRow; handlers: KitsConfigRowHandlers }) {
  const isAtual = row.state.state === 'atual';
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] ${isAtual ? 'border-[#c8a83f]/50' : 'border-border/70'}`}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => handlers.onOpen(row)} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{vigenciaLabel(row)}</span>
            <KitsConfigStatus state={row.state} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel(row)}</p>
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <KitsConfigActionsMenu
            canEdit={canEditConfig(row.state.state, row.usage)} canDelete={canDeleteConfig(row.state.state, row.usage)}
            onDetails={() => handlers.onOpen(row)} onSimular={() => handlers.onSimular(row)} onEdit={() => handlers.onEdit(row)}
            onComparar={() => handlers.onComparar(row)} onNovaVigencia={() => handlers.onNovaVigencia(row)}
            onVerUtilizacao={() => handlers.onVerUtilizacao(row)} onDelete={() => handlers.onDelete(row)}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <Param k="Mínimo" v={`${formatNumberBR(row.minimoKits)} kits`} />
        <Param k="Incremento" v={`${formatNumberBR(row.incrementoFaixa)} kits`} />
        <Param k="Bônus base" v={formatCurrencyBRL(row.bonusBase)} />
        <Param k="Bônus/faixa" v={formatCurrencyBRL(row.bonusPorFaixa)} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {row.usage.utilizada ? `Utilizada em ${pluralizeBR(row.usage.competencias, 'competência', 'competências')} (${pluralizeBR(row.usage.resultados, 'resultado', 'resultados')}).` : 'Sem utilização registrada.'}
        {row.maxFaixas != null && ` · Máx. faixas: ${formatNumberBR(row.maxFaixas)} (não aplicado).`}
      </p>
    </div>
  );
}

function Param({ k, v }: { k: string; v: string }) {
  return <div><span className="text-muted-foreground">{k}: </span><span className="font-medium tabular-nums text-foreground">{v}</span></div>;
}
