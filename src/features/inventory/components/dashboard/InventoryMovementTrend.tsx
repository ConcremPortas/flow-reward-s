import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { GRUPO_LABEL, GRUPO_COR, type GrupoMov, type DashboardData } from './derive';

type Gran = 'dia' | 'semana' | 'mes';
const GRANS: { key: Gran; label: string }[] = [{ key: 'dia', label: 'Diário' }, { key: 'semana', label: 'Semanal' }, { key: 'mes', label: 'Mensal' }];
const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 };
const pad = (n: number) => String(n).padStart(2, '0');

function bucket(iso: string, gran: Gran): { key: string; label: string } {
  const d = new Date(iso);
  if (gran === 'mes') return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${pad(d.getMonth() + 1)}/${d.getFullYear()}` };
  if (gran === 'semana') {
    const wd = (d.getDay() + 6) % 7; // 0=segunda
    const seg = new Date(d.getFullYear(), d.getMonth(), d.getDate() - wd);
    return { key: seg.toISOString().slice(0, 10), label: `${pad(seg.getDate())}/${pad(seg.getMonth() + 1)}` };
  }
  return { key: d.toISOString().slice(0, 10), label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` };
}

export function InventoryMovementTrend({ eventos, loading }: { eventos: DashboardData['eventos']; loading: boolean }) {
  const [gran, setGran] = useState<Gran>('dia');

  const { data, grupos } = useMemo(() => {
    const gruposPresentes = [...new Set(eventos.map((e) => e.grupo))] as GrupoMov[];
    const map = new Map<string, { label: string } & Record<string, number>>();
    for (const e of eventos) {
      const b = bucket(e.createdAt, gran);
      const row = map.get(b.key) ?? ({ label: b.label } as { label: string } & Record<string, number>);
      row[e.grupo] = (row[e.grupo] ?? 0) + e.qtd;
      map.set(b.key, row);
    }
    const rows = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
    return { data: rows, grupos: gruposPresentes };
  }, [eventos, gran]);

  const actions = (
    <div className="flex gap-1">
      {GRANS.map((g) => (
        <button key={g.key} type="button" onClick={() => setGran(g.key)} aria-pressed={gran === g.key}
          className={cn('rounded-md px-2 py-1 text-xs font-medium transition-colors', gran === g.key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>{g.label}</button>
      ))}
    </div>
  );

  return (
    <SectionCard title="Movimentações no período" description="Quantidade movimentada por tipo." actions={actions}>
      {loading ? (
        <Skeleton className="h-[260px] w-full" />
      ) : eventos.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
          <TrendingUp className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sem movimentações no período selecionado.</p>
          <p className="text-xs text-muted-foreground">Amplie o período nos filtros acima.</p>
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {grupos.map((g) => <Line key={g} type="monotone" dataKey={g} name={GRUPO_LABEL[g]} stroke={GRUPO_COR[g]} strokeWidth={2} dot={{ r: 2 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
