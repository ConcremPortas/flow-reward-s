import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumberBR, formatPercentBR } from '@/lib/formatters';
import { ProductionStatusBadge } from './ProductionStatusBadge';
import { ProductionActionsMenu } from './ProductionActionsMenu';
import { competenciaShortLabelBR } from '../domain/productionCalculations';
import type { ProductionHistoryRow } from '../types/production-entry.types';

interface Props {
  rows: ProductionHistoryRow[];
  onOpenDrawer: (row: ProductionHistoryRow) => void;
  onEdit: (row: ProductionHistoryRow) => void;
  onViewIndicators: (row: ProductionHistoryRow) => void;
  onDelete: (row: ProductionHistoryRow) => Promise<void> | void;
}

const fmtDesvio = (d: number | null) => {
  if (d == null) return '—';
  const s = formatNumberBR(Math.abs(d), Number.isInteger(d) ? 0 : 2);
  return d > 0 ? `+${s}` : d < 0 ? `−${s}` : s;
};

export function ProductionHistoryTable({ rows, onOpenDrawer, onEdit, onViewIndicators, onDelete }: Props) {
  const [asc, setAsc] = useState(false);
  const sorted = [...rows].sort((a, b) => (a.competencia === b.competencia ? 0 : a.competencia < b.competencia ? 1 : -1) * (asc ? -1 : 1));

  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>
              <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setAsc((v) => !v)}>
                Competência <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Meta</TableHead>
            <TableHead className="text-right">Realizado</TableHead>
            <TableHead className="text-right">Percentual</TableHead>
            <TableHead className="text-right">Desvio</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
          ) : sorted.map((r) => (
            <TableRow key={r.registroId} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDrawer(r)}>
              <TableCell className="text-sm font-medium">{competenciaShortLabelBR(r.competencia)}</TableCell>
              <TableCell className="text-sm">
                {r.setorNome}
                {r.empresaNome && <span className="block text-xs text-muted-foreground">{r.empresaNome}</span>}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">{r.meta != null ? formatNumberBR(r.meta) : '—'}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{r.realizado != null ? formatNumberBR(r.realizado) : '—'}</TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">{r.percentual != null ? formatPercentBR(r.percentual, 1) : '—'}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{fmtDesvio(r.desvio)}</TableCell>
              <TableCell><ProductionStatusBadge situacao={r.situacao} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.unidade}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <ProductionActionsMenu
                  setorNome={r.setorNome}
                  competenciaLabel={competenciaShortLabelBR(r.competencia)}
                  onView={() => onOpenDrawer(r)}
                  onEdit={() => onEdit(r)}
                  onViewIndicators={() => onViewIndicators(r)}
                  onDelete={() => onDelete(r)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
