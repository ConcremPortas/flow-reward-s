import { PanelRightOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatPercentBR } from '@/lib/formatters';
import { INDICATOR_DEFINITIONS } from '../domain/indicatorDefinitions';
import { SectorIndicatorCell } from './SectorIndicatorCell';
import { SectorIndicatorStatus } from './SectorIndicatorStatus';
import type { SectorIndicatorRow } from '../types/sector-indicators.types';

interface Props {
  rows: SectorIndicatorRow[];
  competencia: string;
  changedSetorIds: Set<string>;
  comparing: boolean;
  isSelected: (setorId: string) => boolean;
  onToggleSelect: (setorId: string) => void;
  onToggleSelectPage: (setorIds: string[], value: boolean) => void;
  onOpenDrawer: (row: SectorIndicatorRow) => void;
}

/**
 * Matriz de apuração — heatmap por indicador, alta densidade. A edição acontece
 * no drawer (clique na linha), evitando dezenas de inputs visíveis na grade.
 */
export function SectorIndicatorsMatrix({
  rows, competencia, changedSetorIds, comparing, isSelected, onToggleSelect, onToggleSelectPage, onOpenDrawer,
}: Props) {
  const pageIds = rows.map((r) => r.setorId);
  const allSelected = pageIds.length > 0 && pageIds.every(isSelected);
  const someSelected = pageIds.some(isSelected);

  return (
    <>
      {/* Desktop / notebook / tablet — tabela com scroll horizontal e 1ª coluna fixa */}
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => onToggleSelectPage(pageIds, !!v)}
                  aria-label="Selecionar todos os setores da página"
                />
              </TableHead>
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/95">Setor</TableHead>
              {INDICATOR_DEFINITIONS.map((d) => (
                <TableHead key={d.id} className="text-right text-xs">{d.shortLabel}</TableHead>
              ))}
              <TableHead className="text-right">Média</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={INDICATOR_DEFINITIONS.length + 5} className="py-10 text-center text-sm text-muted-foreground">Nenhum setor encontrado para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map((row) => {
              const changed = changedSetorIds.has(row.setorId);
              return (
                <TableRow
                  key={row.setorId}
                  className={cn('cursor-pointer hover:bg-muted/40', changed && 'bg-status-warning/[0.04]', row.situacao === 'pendente' && !changed && 'bg-muted/20')}
                  onClick={() => onOpenDrawer(row)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected(row.setorId)} onCheckedChange={() => onToggleSelect(row.setorId)} aria-label={`Selecionar ${row.setorNome}`} />
                  </TableCell>
                  <TableCell className="sticky left-0 z-10 bg-card">
                    <p className="text-sm font-medium text-foreground">{row.setorNome}</p>
                    <p className="text-xs text-muted-foreground">{row.empresaNome || '—'}</p>
                  </TableCell>
                  {INDICATOR_DEFINITIONS.map((d) => (
                    <TableCell key={d.id} className="p-1.5">
                      <SectorIndicatorCell cell={row.cells[d.id]} competencia={competencia} comparing={comparing} />
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {row.media != null ? formatPercentBR(row.media, 1) : row.semMedicao ? 's/m' : '—'}
                  </TableCell>
                  <TableCell><SectorIndicatorStatus situacao={row.situacao} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenDrawer(row)} aria-label={`Apurar ${row.setorNome}`}>
                      <PanelRightOpen className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum setor encontrado para os filtros selecionados.</p>
        ) : rows.map((row) => {
          const changed = changedSetorIds.has(row.setorId);
          return (
            <div key={row.setorId} className={cn('rounded-xl border border-border/70 bg-card p-4', changed && 'border-status-warning/40 bg-status-warning/[0.03]')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Checkbox className="mt-0.5" checked={isSelected(row.setorId)} onCheckedChange={() => onToggleSelect(row.setorId)} aria-label={`Selecionar ${row.setorNome}`} />
                  <button type="button" onClick={() => onOpenDrawer(row)} className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-foreground">{row.setorNome}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.empresaNome || '—'}</p>
                  </button>
                </div>
                <SectorIndicatorStatus situacao={row.situacao} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {INDICATOR_DEFINITIONS.map((d) => (
                  <div key={d.id} className="text-center">
                    <SectorIndicatorCell cell={row.cells[d.id]} competencia={competencia} comparing={comparing} />
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{d.shortLabel}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Média: <b className="text-foreground">{row.media != null ? formatPercentBR(row.media, 1) : row.semMedicao ? 's/m' : '—'}</b></span>
                {row.piorIndicador && (
                  <span className="text-muted-foreground">Pior: <b className="text-foreground">{INDICATOR_DEFINITIONS.find((d) => d.id === row.piorIndicador!.indicatorId)?.shortLabel} {formatPercentBR(row.piorIndicador.percentual, 1)}</b></span>
                )}
                <Button variant="outline" size="sm" className="h-7" onClick={() => onOpenDrawer(row)}>Apurar</Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
