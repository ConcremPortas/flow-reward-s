import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { OccurrenceHistoryRow, OccurrenceMonthPoint } from '@/features/occurrences/types';
import { computeImpactoPremiacao } from '@/features/occurrences/domain/occurrenceCalculations';
import { competenciaLabel } from '@/features/dashboard/utils/dates';

interface Props {
  row: OccurrenceHistoryRow | null;
  evolucao: OccurrenceMonthPoint[]; // 12 meses do funcionário selecionado
  onClose: () => void;
}

export function OccurrenceHistoryDrawer({ row, evolucao, onClose }: Props) {
  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  const impacto = computeImpactoPremiacao(row.faltas, row.advertencias);
  const competenciasComOcorrencia = evolucao.filter((p) => p.totalFaltas > 0 || p.totalAdvertencias > 0);
  const totalFaltas12m = evolucao.reduce((a, p) => a + p.totalFaltas, 0);
  const totalAdvertencias12m = evolucao.reduce((a, p) => a + p.totalAdvertencias, 0);

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{row.nome}</SheetTitle></SheetHeader>

        <p className="mt-1 text-xs text-muted-foreground">{row.cod || 'sem código'} · {row.setor || 'Sem setor'} · {competenciaLabel(row.competencia)}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Faltas na competência" value={String(row.faltas)} />
          <Field label="Advertências na competência" value={String(row.advertencias)} />
          <Field label="Total 12 meses (faltas)" value={String(totalFaltas12m)} />
          <Field label="Total 12 meses (advertências)" value={String(totalAdvertencias12m)} />
        </div>

        <div className="mt-5 rounded-lg border border-border/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Impacto na premiação (fórmula do motor de cálculo)</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div><p className="text-lg font-bold text-foreground">{(impacto.notaFaltas * 100).toFixed(0)}%</p><p className="text-[11px] text-muted-foreground">nota de faltas</p></div>
            <div><p className="text-lg font-bold text-foreground">{(impacto.notaAdvertencias * 100).toFixed(0)}%</p><p className="text-[11px] text-muted-foreground">nota de advertências</p></div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Calculado com as mesmas regras do motor de premiação (calcularNotaFaltas/calcularNotaAdvertencias) — a nota geral final também depende do peso da fórmula da categoria do funcionário.</p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evolução de 12 meses</p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Line type="monotone" dataKey="totalFaltas" name="Faltas" stroke="hsl(var(--status-warning))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="totalAdvertencias" name="Advertências" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competências com ocorrência</p>
          {competenciasComOcorrencia.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma ocorrência nos últimos 12 meses.</p>
          ) : (
            <div className="space-y-1.5">
              {competenciasComOcorrencia.map((p) => (
                <div key={p.competencia} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-medium text-foreground">{p.totalFaltas} falta(s) · {p.totalAdvertencias} advertência(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
