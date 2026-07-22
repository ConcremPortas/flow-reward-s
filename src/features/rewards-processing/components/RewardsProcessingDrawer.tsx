import { useMemo, useState } from 'react';
import { RefreshCw, FileBarChart2, Users, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { competenciaToMes } from '../domain/rewardsProcessingScope';
import { traceFromResultado } from '../domain/rewardsCalculationTrace';
import { RewardCalculationTrace } from './RewardCalculationTrace';
import type { ProcessingRow } from '../types/rewards-processing.types';

interface Props {
  row: ProcessingRow | null;
  resultados: ResultadoPremiacao[];
  onClose: () => void;
  onReprocess: (r: ProcessingRow) => void;
  onReport: (r: ProcessingRow) => void;
}

export function RewardsProcessingDrawer({ row, resultados, onClose, onReprocess, onReport }: Props) {
  const [selected, setSelected] = useState<ResultadoPremiacao | null>(null);

  const linhas = useMemo(() => {
    if (!row) return [];
    const mes = competenciaToMes(row.competencia);
    return resultados.filter(r => r.mes_competencia === mes && (r.base_premiacao_id ?? '') === row.baseId).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [row, resultados]);

  const stats = useMemo(() => {
    const total = linhas.reduce((s, r) => s + (r.bonus_alcancado || 0), 0);
    const comBonus = linhas.filter(r => (r.bonus_alcancado || 0) > 0).length;
    const faixas = new Map<string, number>();
    for (const r of linhas) faixas.set(r.faixa || 'Sem faixa', (faixas.get(r.faixa || 'Sem faixa') || 0) + 1);
    return { total, comBonus, semBonus: linhas.length - comBonus, medio: linhas.length ? total / linhas.length : 0, faixas: [...faixas.entries()] };
  }, [linhas]);

  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;
  const maxFaixa = Math.max(1, ...stats.faixas.map(([, n]) => n));

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) { setSelected(null); onClose(); } }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[640px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate">{row.baseNome}</SheetTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{competenciaLabelLong(row.competencia)} · {row.categorias.join(', ') || 'sem categorias'}</p>
        </SheetHeader>

        {selected ? (
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
            <div>
              <p className="text-sm font-semibold text-foreground">{selected.nome}</p>
              <p className="text-xs text-muted-foreground">{selected.setor} · {selected.categoria} · faixa {selected.faixa}</p>
            </div>
            <RewardCalculationTrace trace={traceFromResultado(selected)} />
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Resultados" value={String(row.resultados)} />
              <Field label="Valor total" value={formatCurrencyBRL(stats.total)} highlight />
              <Field label="Valor médio" value={formatCurrencyBRL(stats.medio)} />
              <Field label="Com / sem bônus" value={`${stats.comBonus} / ${stats.semBonus}`} />
            </div>

            {stats.faixas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distribuição por faixa</p>
                <div className="space-y-2">
                  {stats.faixas.sort((a, b) => b[1] - a[1]).map(([faixa, n]) => (
                    <div key={faixa}>
                      <div className="flex justify-between text-sm"><span className="truncate">{faixa}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
                      <Progress value={(n / maxFaixa) * 100} className="mt-1 h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5" /> Funcionários</p>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-1.5">
                {linhas.map(r => (
                  <button key={r.id} type="button" onClick={() => setSelected(r)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                    <span className="min-w-0"><span className="block truncate font-medium text-foreground">{r.nome}</span><span className="block truncate text-xs text-muted-foreground">{r.setor} · nota {formatPercentBR(r.nota_geral * 100, 0)}</span></span>
                    <span className="shrink-0 tabular-nums font-medium">{formatCurrencyBRL(r.bonus_alcancado)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border/60 px-5 py-3">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={() => onReprocess(row)}><RefreshCw className="h-4 w-4" /> Reprocessar</Button>
          <Button variant="ghost" className="flex-1 gap-1.5" onClick={() => onReport(row)}><FileBarChart2 className="h-4 w-4" /> Abrir relatório</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 ${highlight ? 'border-[#c8a83f]/40 bg-[#f7f0d7]/30' : 'border-border/70'}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold ${highlight ? 'text-[#7a5f16]' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
