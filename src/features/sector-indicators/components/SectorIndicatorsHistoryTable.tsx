import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPercentBR } from '@/lib/formatters';
import { INDICATOR_DEFINITIONS } from '../domain/indicatorDefinitions';
import { competenciaShortLabelBR } from '../domain/indicatorCalculations';
import { SectorIndicatorCell } from './SectorIndicatorCell';
import { SectorIndicatorStatus } from './SectorIndicatorStatus';
import { SectorIndicatorsActionsMenu } from './SectorIndicatorsActionsMenu';
import type { SectorIndicatorHistoryRow } from '../types/sector-indicators.types';

interface Props {
  rows: SectorIndicatorHistoryRow[];
  onOpenDrawer: (row: SectorIndicatorHistoryRow) => void;
  onEdit: (row: SectorIndicatorHistoryRow) => void;
  onViewIndicadoresGerais: (row: SectorIndicatorHistoryRow) => void;
  onDelete: (row: SectorIndicatorHistoryRow) => Promise<void> | void;
}

function pior(row: SectorIndicatorHistoryRow): string {
  if (!row.piorIndicador) return '—';
  const def = INDICATOR_DEFINITIONS.find((d) => d.id === row.piorIndicador!.indicatorId);
  return `${def?.shortLabel ?? ''} ${formatPercentBR(row.piorIndicador.percentual, 1)}`;
}

const mediaLabel = (row: SectorIndicatorHistoryRow) => (row.media != null ? formatPercentBR(row.media, 1) : row.semMedicao ? 's/m' : '—');

export function SectorIndicatorsHistoryTable({ rows, onOpenDrawer, onEdit, onViewIndicadoresGerais, onDelete }: Props) {
  const [asc, setAsc] = useState(false);
  const sorted = [...rows].sort((a, b) => (a.competencia === b.competencia ? 0 : a.competencia < b.competencia ? 1 : -1) * (asc ? -1 : 1));

  const actions = (r: SectorIndicatorHistoryRow) => (
    <SectorIndicatorsActionsMenu
      setorNome={r.setorNome}
      competenciaLabel={competenciaShortLabelBR(r.competencia)}
      onView={() => onOpenDrawer(r)}
      onEdit={() => onEdit(r)}
      onViewIndicadoresGerais={() => onViewIndicadoresGerais(r)}
      onDelete={() => onDelete(r)}
    />
  );

  const CompetenciaHeader = (
    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setAsc((v) => !v)}>
      Competência <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      {/* Desktop largo — tabela completa com heatmap por indicador */}
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 xl:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>{CompetenciaHeader}</TableHead>
              <TableHead>Setor</TableHead>
              {INDICATOR_DEFINITIONS.map((d) => <TableHead key={d.id} className="text-right text-xs">{d.shortLabel}</TableHead>)}
              <TableHead className="text-right">Média</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow><TableCell colSpan={INDICATOR_DEFINITIONS.length + 5} className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : sorted.map((r) => (
              <TableRow key={r.registroId} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDrawer(r)}>
                <TableCell className="text-sm font-medium">{competenciaShortLabelBR(r.competencia)}</TableCell>
                <TableCell className="text-sm">{r.setorNome}{r.empresaNome && <span className="block text-xs text-muted-foreground">{r.empresaNome}</span>}</TableCell>
                {INDICATOR_DEFINITIONS.map((d) => (
                  <TableCell key={d.id} className="p-1.5"><SectorIndicatorCell cell={r.cells[d.id]} competencia={r.competencia} /></TableCell>
                ))}
                <TableCell className="text-right text-sm font-semibold tabular-nums">{mediaLabel(r)}</TableCell>
                <TableCell><SectorIndicatorStatus situacao={r.situacao} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{actions(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Notebook — tabela reduzida (média + pior indicador) */}
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 md:block xl:hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>{CompetenciaHeader}</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead className="text-right">Média</TableHead>
              <TableHead className="text-right">Pior indicador</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : sorted.map((r) => (
              <TableRow key={r.registroId} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDrawer(r)}>
                <TableCell className="text-sm font-medium">{competenciaShortLabelBR(r.competencia)}</TableCell>
                <TableCell className="text-sm">{r.setorNome}</TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">{mediaLabel(r)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{pior(r)}</TableCell>
                <TableCell><SectorIndicatorStatus situacao={r.situacao} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{actions(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>
        ) : sorted.map((r) => (
          <div key={r.registroId} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => onOpenDrawer(r)} className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-foreground">{r.setorNome}</p>
                <p className="text-xs text-muted-foreground">{competenciaShortLabelBR(r.competencia)}</p>
              </button>
              <div onClick={(e) => e.stopPropagation()}>{actions(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Média: <b className="text-foreground">{mediaLabel(r)}</b></span>
              <span className="text-muted-foreground">Pior: <b className="text-foreground">{pior(r)}</b></span>
              <SectorIndicatorStatus situacao={r.situacao} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
