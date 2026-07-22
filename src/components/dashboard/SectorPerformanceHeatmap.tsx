import { useMemo, useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { RiskLevel, SectorRow } from '@/features/dashboard/types';
import { METAS } from '@/features/dashboard/metricDefinitions';
import { fmtCurrency } from '@/features/dashboard/utils/format';

type SortKey = 'setor' | 'headcount' | 'producaoPct' | 'absenteismo' | 'dssPct' | 'epiPendencias' | 'advertencias' | 'elegibilidadePct' | 'premiacaoMedia' | 'risco';

const RISK_BADGE: Record<RiskLevel, string> = {
  baixo: 'bg-success/10 text-success', medio: 'bg-status-warning/10 text-status-warning', alto: 'bg-destructive/10 text-destructive',
};
const RISK_RANK: Record<RiskLevel, number> = { alto: 3, medio: 2, baixo: 1 };

const tone = (kind: 'prod' | 'abs' | 'dss' | 'epi', v: number | null): string => {
  if (v == null) return 'text-muted-foreground';
  if (kind === 'prod') return v >= METAS.producaoMeta ? 'bg-success/10 text-success' : v >= 90 ? 'bg-status-warning/10 text-status-warning' : 'bg-destructive/10 text-destructive';
  if (kind === 'abs') return v <= METAS.absenteismoMax ? 'bg-success/10 text-success' : v <= METAS.absenteismoMax * 2 ? 'bg-status-warning/10 text-status-warning' : 'bg-destructive/10 text-destructive';
  if (kind === 'dss') return v >= METAS.dssMin ? 'bg-success/10 text-success' : v >= METAS.dssMin - 15 ? 'bg-status-warning/10 text-status-warning' : 'bg-destructive/10 text-destructive';
  return v === 0 ? 'bg-success/10 text-success' : v <= 2 ? 'bg-status-warning/10 text-status-warning' : 'bg-destructive/10 text-destructive';
};

interface Props {
  rows: SectorRow[];
  onOpenSector?: (row: SectorRow) => void;
  className?: string;
}

export function SectorPerformanceHeatmap({ rows, onOpenSector, className }: Props) {
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('risco');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const filtered = rows.filter(r => !q || r.setor.toLowerCase().includes(q.toLowerCase()));
    const val = (r: SectorRow): number | string => {
      if (sortKey === 'setor') return r.setor;
      if (sortKey === 'risco') return RISK_RANK[r.risco.level];
      const v = (r as unknown as Record<string, number | null>)[sortKey];
      return v == null ? -1 : v;
    };
    return [...filtered].sort((a, b) => {
      const va = val(a), vb = val(b);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, q, sortKey, dir]);

  const th = (key: SortKey, label: string, align = 'left') => (
    <TableHead className={cn('whitespace-nowrap', align === 'right' && 'text-right', align === 'center' && 'text-center')}>
      <button
        type="button"
        onClick={() => { if (sortKey === key) setDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setDir('desc'); } }}
        className={cn('inline-flex items-center gap-1 hover:text-foreground', sortKey === key ? 'text-foreground' : 'text-muted-foreground')}
      >
        {label}<ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );

  const cell = (kind: 'prod' | 'abs' | 'dss' | 'epi', v: number | null, suffix = '') => (
    <TableCell className="text-center">
      {v == null ? <span className="text-muted-foreground">—</span> : (
        <span className={cn('inline-block rounded px-1.5 py-0.5 text-xs font-medium', tone(kind, v))}>
          {kind === 'abs' || kind === 'prod' || kind === 'dss' ? v.toFixed(kind === 'abs' ? 1 : 0) : v}{suffix}
        </span>
      )}
    </TableCell>
  );

  return (
    <SectionCard
      title="Mapa de Performance dos Setores"
      description={`${sorted.length} setor(es) · ordenado por ${sortKey === 'risco' ? 'risco' : sortKey}`}
      className={className}
      actions={
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar setor..." value={q} onChange={e => setQ(e.target.value)} className="h-9 pl-8" />
        </div>
      }
      noBodyPadding
    >
      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95 [&>th]:text-xs">
              {th('setor', 'Setor')}
              {th('headcount', 'Pessoas', 'center')}
              {th('producaoPct', 'Produção', 'center')}
              {th('absenteismo', 'Absent.', 'center')}
              {th('dssPct', 'DSS', 'center')}
              {th('epiPendencias', 'EPI', 'center')}
              {th('advertencias', 'Advert.', 'center')}
              {th('elegibilidadePct', 'Elegib.', 'center')}
              {th('premiacaoMedia', 'Prem. média', 'right')}
              {th('risco', 'Risco', 'center')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
            ) : sorted.map(r => (
              <TableRow key={r.setorId} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenSector?.(r)}>
                <TableCell className="font-medium">
                  <div className="max-w-[220px] truncate">{r.setor}</div>
                  {r.gestor && <div className="truncate text-[11px] text-muted-foreground">{r.gestor}</div>}
                </TableCell>
                <TableCell className="text-center tabular-nums">{r.headcount}</TableCell>
                {cell('prod', r.producaoPct, '%')}
                {cell('abs', r.absenteismo)}
                {cell('dss', r.dssPct, '%')}
                {cell('epi', r.epiPendencias)}
                <TableCell className="text-center tabular-nums">{r.advertencias}</TableCell>
                <TableCell className="text-center tabular-nums">{r.elegibilidadePct == null ? '—' : `${r.elegibilidadePct}%`}</TableCell>
                <TableCell className="text-right tabular-nums">{r.premiacaoMedia == null ? '—' : fmtCurrency(r.premiacaoMedia)}</TableCell>
                <TableCell className="text-center">
                  <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', RISK_BADGE[r.risco.level])}>
                    {r.risco.level}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
