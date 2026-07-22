import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import { tipoMeta } from './movementMeta';
import type { MovDetalhada } from '../../services/inventoryApi';
import type { VarInfo, Agrupamento } from '../../hooks/useInventoryMovements';

interface Props { agrupamento: Exclude<Agrupamento, 'lista'>; movs: MovDetalhada[]; varInfo: Map<string, VarInfo>; unidadeNome: Map<string, string> }

function Barra({ pct }: { pct: number }) { return <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, 2)}%` }} /></div>; }

export function MovementGroups({ agrupamento, movs, varInfo, unidadeNome }: Props) {
  const linhas = useMemo(() => {
    if (agrupamento === 'tipo') {
      const m = new Map<string, { ops: number; pecas: number }>();
      for (const mv of movs) { const r = m.get(mv.tipo) ?? { ops: 0, pecas: 0 }; r.ops++; r.pecas += mv.itens.reduce((a, i) => a + i.quantidade, 0); m.set(mv.tipo, r); }
      const tot = [...m.values()].reduce((a, r) => a + r.ops, 0) || 1;
      return [...m.entries()].map(([k, r]) => ({ id: k, titulo: tipoMeta(k).label, a: `${formatNumberBR(r.ops)} ops`, b: `${formatNumberBR(r.pecas)} pç`, pct: Math.round((r.ops / tot) * 100) })).sort((x, y) => y.pct - x.pct);
    }
    if (agrupamento === 'unidade') {
      const m = new Map<string, { inp: number; out: number; ops: number }>();
      for (const mv of movs) { const r = m.get(mv.unidadeId) ?? { inp: 0, out: 0, ops: 0 }; r.ops++; for (const it of mv.itens) { if (it.direcao === 'IN') r.inp += it.quantidade; else r.out += it.quantidade; } m.set(mv.unidadeId, r); }
      const tot = [...m.values()].reduce((a, r) => a + r.ops, 0) || 1;
      return [...m.entries()].map(([k, r]) => ({ id: k, titulo: unidadeNome.get(k) ?? '—', a: `+${formatNumberBR(r.inp)} / −${formatNumberBR(r.out)}`, b: `líquido ${r.inp - r.out >= 0 ? '+' : ''}${formatNumberBR(r.inp - r.out)} · ${r.ops} ops`, pct: Math.round((r.ops / tot) * 100) })).sort((x, y) => y.pct - x.pct);
    }
    if (agrupamento === 'item') {
      const m = new Map<string, { inp: number; out: number; ult: string }>();
      for (const mv of movs) for (const it of mv.itens) { const r = m.get(it.varianteId) ?? { inp: 0, out: 0, ult: mv.createdAt }; if (it.direcao === 'IN') r.inp += it.quantidade; else r.out += it.quantidade; if (mv.createdAt > r.ult) r.ult = mv.createdAt; m.set(it.varianteId, r); }
      const tot = [...m.values()].reduce((a, r) => a + r.inp + r.out, 0) || 1;
      return [...m.entries()].map(([k, r]) => ({ id: k, titulo: varInfo.get(k)?.nome ?? 'Item', a: `+${formatNumberBR(r.inp)} / −${formatNumberBR(r.out)}`, b: `mov. ${formatNumberBR(r.inp + r.out)} · última ${formatDateBR(r.ult)}`, pct: Math.round(((r.inp + r.out) / tot) * 100) })).sort((x, y) => y.pct - x.pct);
    }
    const m = new Map<string, { ops: number; pecas: number }>();
    for (const mv of movs) { const r = m.get(mv.operadorNome) ?? { ops: 0, pecas: 0 }; r.ops++; r.pecas += mv.itens.reduce((a, i) => a + i.quantidade, 0); m.set(mv.operadorNome, r); }
    const tot = [...m.values()].reduce((a, r) => a + r.ops, 0) || 1;
    return [...m.entries()].map(([k, r]) => ({ id: k, titulo: k, a: `${formatNumberBR(r.ops)} ops`, b: `${formatNumberBR(r.pecas)} pç`, pct: Math.round((r.ops / tot) * 100) })).sort((x, y) => y.pct - x.pct);
  }, [agrupamento, movs, varInfo, unidadeNome]);

  if (linhas.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Sem dados para agrupar.</p>;
  return (
    <ul className="space-y-3">
      {linhas.map((l) => (
        <li key={l.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate font-medium text-foreground">{l.titulo}</span><span className="shrink-0 tabular-nums text-muted-foreground">{l.a} · {l.pct}%</span></div>
          <Barra pct={l.pct} />
          <div className="mt-0.5 text-xs text-muted-foreground">{l.b}</div>
        </li>
      ))}
    </ul>
  );
}
