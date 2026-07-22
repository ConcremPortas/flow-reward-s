import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatNumberBR, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { lastCompetencias, competenciaLabel } from '@/features/dashboard/utils/dates';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import { ProductionStatusBadge } from './ProductionStatusBadge';
import { calcularPercentual, dateToCompetencia } from '../domain/productionCalculations';
import type { ProductionRow } from '../types/production-entry.types';

interface Props {
  row: ProductionRow | null;
  competencia: string;
  registros: ProducaoSetor[];
  onClose: () => void;
}

export function ProductionSectorDrawer({ row, competencia, registros, onClose }: Props) {
  const navigate = useNavigate();

  const serie = useMemo(() => {
    if (!row) return [];
    const meses = lastCompetencias(competencia, 12);
    const porComp = new Map<string, { meta: number; realizado: number }>();
    for (const r of registros) {
      if (r.setor_id !== row.setorId || r.unidade_medida === 'percentual') continue;
      porComp.set(dateToCompetencia(r.data_producao), { meta: r.meta_diaria ?? 0, realizado: r.producao_realizada ?? 0 });
    }
    return meses.map((c) => {
      const v = porComp.get(c);
      return {
        label: competenciaLabel(c),
        realizado: v?.realizado ?? null,
        percentual: v ? calcularPercentual(v.realizado, v.meta) : null,
      };
    });
  }, [row, competencia, registros]);

  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  const temHistorico = serie.some((p) => p.realizado != null);

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{row.setorNome}</SheetTitle></SheetHeader>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.empresaNome || 'Empresa não informada'} · {competenciaLabelLong(competencia)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Field label="Meta" value={row.meta != null ? formatNumberBR(row.meta) : '—'} />
          <Field label="Realizado" value={row.realizado != null ? formatNumberBR(row.realizado) : '—'} />
          <Field label="Percentual" value={row.percentual != null ? formatPercentBR(row.percentual, 1) : '—'} />
          <Field label="Desvio" value={row.desvio != null ? formatNumberBR(row.desvio, Number.isInteger(row.desvio) ? 0 : 2) : '—'} />
          <Field label="Unidade" value={row.unidade} />
          <div className="rounded-lg border border-border/70 p-2.5">
            <p className="text-[11px] text-muted-foreground">Situação</p>
            <div className="mt-1"><ProductionStatusBadge situacao={row.situacao} /></div>
          </div>
        </div>

        {row.observacoes && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</p>
            <p className="mt-1 text-sm text-foreground">{row.observacoes}</p>
          </div>
        )}

        {temHistorico && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Realizado — últimos 12 meses</p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-5">
          <Button variant="outline" className="w-full gap-1.5" onClick={() => navigate(`/premiacoes/indicadores-setor?setor=${row.setorId}`)}>
            <BarChart3 className="h-4 w-4" /> Ver indicadores do setor
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
