import { useMemo } from 'react';
import { Pencil, BarChart3 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { INDICATOR_DEFINITIONS } from '../domain/indicatorDefinitions';
import { calcularVariacaoPP } from '../domain/indicatorCalculations';
import { CELL_STATE_META } from '../domain/indicatorStatus';
import { SectorIndicatorStatus } from './SectorIndicatorStatus';
import type { SectorIndicatorHistoryRow } from '../types/sector-indicators.types';

interface Props {
  row: SectorIndicatorHistoryRow | null;
  historyRows: SectorIndicatorHistoryRow[];
  onClose: () => void;
  onEdit: (row: SectorIndicatorHistoryRow) => void;
  onViewIndicadoresGerais: (row: SectorIndicatorHistoryRow) => void;
}

const fmtDesvio = (d: number | null) => {
  if (d == null) return '—';
  const s = formatNumberBR(Math.abs(d), Number.isInteger(d) ? 0 : 2);
  return d > 0 ? `+${s}` : d < 0 ? `−${s}` : s;
};

/** Drawer do histórico — leitura do registro salvo, com comparação vs. competência anterior. */
export function SectorIndicatorsHistoryDrawer({ row, historyRows, onClose, onEdit, onViewIndicadoresGerais }: Props) {
  const anterior = useMemo(() => {
    if (!row) return null;
    return historyRows
      .filter((r) => r.setorId === row.setorId && r.competencia < row.competencia)
      .sort((a, b) => (a.competencia < b.competencia ? 1 : -1))[0] ?? null;
  }, [row, historyRows]);

  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[600px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate">{row.setorNome}</SheetTitle>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {row.empresaNome || 'Empresa não informada'} · {competenciaLabelLong(row.competencia)}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <SectorIndicatorStatus situacao={row.situacao} />
            <span className="text-sm text-muted-foreground">
              Resultado consolidado: <b className="text-foreground">{row.media != null ? formatPercentBR(row.media, 1) : row.semMedicao ? 'sem medição' : '—'}</b>
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
          {INDICATOR_DEFINITIONS.map((def) => {
            const cell = row.cells[def.id];
            const antCell = anterior?.cells[def.id];
            const variacao = calcularVariacaoPP(cell.percentual, antCell?.percentual ?? null);
            const stateMeta = CELL_STATE_META[cell.state];
            return (
              <div key={def.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{def.label}</p>
                  <span className={cn('rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums', stateMeta.heatmap)}>
                    {cell.state === 'sem_medicao' ? 's/m' : cell.percentual != null ? formatPercentBR(cell.percentual, def.precision) : '—'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <Field label="Meta" value={cell.meta != null ? formatNumberBR(cell.meta, Number.isInteger(cell.meta) ? 0 : 2) : '—'} />
                  <Field label="Realizado" value={cell.realizado != null ? formatNumberBR(cell.realizado, Number.isInteger(cell.realizado) ? 0 : 2) : '—'} />
                  <Field label="Diferença" value={fmtDesvio(cell.desvio)} />
                </div>
                {antCell?.percentual != null && (
                  <p className="mt-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    Anterior: <b className="text-foreground">{formatPercentBR(antCell.percentual, def.precision)}</b>
                    {variacao != null && (
                      <span className={cn('ml-2', variacao >= 0 ? 'text-success' : 'text-destructive')}>
                        {variacao >= 0 ? '+' : ''}{formatNumberBR(variacao, 1)} p.p.
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 px-5 py-3">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={() => onEdit(row)}><Pencil className="h-4 w-4" /> Editar apuração</Button>
          <Button variant="ghost" className="flex-1 gap-1.5" onClick={() => onViewIndicadoresGerais(row)}><BarChart3 className="h-4 w-4" /> Ver Indicadores Gerais</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
