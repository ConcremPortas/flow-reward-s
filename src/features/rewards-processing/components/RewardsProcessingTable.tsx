import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { competenciaShortLabelBR } from '../domain/rewardsProcessingScope';
import { RewardsProcessingActionsMenu } from './RewardsProcessingActionsMenu';
import type { ProcessingRow } from '../types/rewards-processing.types';

interface Props {
  rows: ProcessingRow[];
  onOpenDrawer: (r: ProcessingRow) => void;
  onDetails: (r: ProcessingRow) => void;
  onEmployees: (r: ProcessingRow) => void;
  onCompare: (r: ProcessingRow) => void;
  onReprocess: (r: ProcessingRow) => void;
  onReport: (r: ProcessingRow) => void;
  onDelete: (r: ProcessingRow) => Promise<void> | void;
}

export function RewardsProcessingTable({ rows, onOpenDrawer, onDetails, onEmployees, onCompare, onReprocess, onReport, onDelete }: Props) {
  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Competência</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Categorias</TableHead>
            <TableHead className="text-right">Resultados</TableHead>
            <TableHead className="text-right">Valor total</TableHead>
            <TableHead>Processado em</TableHead>
            <TableHead>Integridade</TableHead>
            <TableHead className="w-10 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhum processamento encontrado.</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={`${r.mesCompetencia}-${r.baseId || 'sembase'}`} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDrawer(r)}>
              <TableCell className="text-sm font-medium">{competenciaShortLabelBR(r.competencia)}</TableCell>
              <TableCell className="text-sm">{r.baseNome}</TableCell>
              <TableCell className="text-sm">
                {r.categorias.length === 0 ? <span className="text-muted-foreground">—</span>
                  : r.categorias.length === 1 ? r.categorias[0]
                  : (
                    <Tooltip>
                      <TooltipTrigger asChild><span className="cursor-default underline decoration-dotted">{r.categorias.length} categorias</span></TooltipTrigger>
                      <TooltipContent>{r.categorias.join(', ')}</TooltipContent>
                    </Tooltip>
                  )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.resultados}
                {r.funcionariosUnicos !== r.resultados && <span className="block text-[11px] text-muted-foreground">{r.funcionariosUnicos} únicos</span>}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrencyBRL(r.valorTotal)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.processadoEm ? formatDateTimeBR(r.processadoEm) : '—'}</TableCell>
              <TableCell>{r.integridade === 'ok' ? <StatusBadge variant="success">Íntegro</StatusBadge> : <StatusBadge variant="warning">Incompleto</StatusBadge>}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <RewardsProcessingActionsMenu
                  row={r} competenciaLabel={competenciaShortLabelBR(r.competencia)}
                  onDetails={() => onDetails(r)} onEmployees={() => onEmployees(r)} onCompare={() => onCompare(r)}
                  onReprocess={() => onReprocess(r)} onReport={() => onReport(r)} onDelete={() => onDelete(r)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
