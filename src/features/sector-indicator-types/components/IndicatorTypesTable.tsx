import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { IndicatorTypeCode } from './IndicatorTypeCode';
import { IndicatorTypeStatus } from './IndicatorTypeStatus';
import { IndicatorTypeUsage } from './IndicatorTypeUsage';
import { IndicatorTypeActionsMenu } from './IndicatorTypeActionsMenu';
import type { IndicatorTypeRow } from '../types/indicator-type.types';

export interface IndicatorTypeRowHandlers {
  onOpen: (r: IndicatorTypeRow) => void;
  onEdit: (r: IndicatorTypeRow) => void;
  onVerMedicoes: (r: IndicatorTypeRow) => void;
  onDelete: (r: IndicatorTypeRow) => void;
}

function IndicadorCell({ row }: { row: IndicatorTypeRow }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{row.nome}</p>
      {row.descricao && row.descricao.trim() && <p className="truncate text-xs text-muted-foreground">{row.descricao}</p>}
    </div>
  );
}

export function IndicatorTypesTable({ rows, handlers }: { rows: IndicatorTypeRow[]; handlers: IndicatorTypeRowHandlers }) {
  const menu = (r: IndicatorTypeRow) => (
    <IndicatorTypeActionsMenu
      nome={r.nome} temMedicoes={r.usage.medicoes > 0}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onVerMedicoes={() => handlers.onVerMedicoes(r)} onDelete={() => handlers.onDelete(r)}
    />
  );
  const medicoes = (r: IndicatorTypeRow) => r.usage.medicoes > 0
    ? `${pluralizeBR(r.usage.medicoes, 'medição', 'medições')} · ${pluralizeBR(r.usage.setores, 'setor', 'setores')}`
    : '—';

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-20">Código</TableHead>
              <TableHead>Indicador</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead className="text-right">Medições</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum tipo de indicador encontrado para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><IndicatorTypeCode codigo={r.codigo} /></TableCell>
                <TableCell><IndicadorCell row={r} /></TableCell>
                <TableCell><IndicatorTypeUsage usage={r.usage} /></TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{r.usage.medicoes > 0 ? formatNumberBR(r.usage.medicoes) : '—'}</TableCell>
                <TableCell><StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></TableCell>
                <TableCell><IndicatorTypeStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum tipo encontrado.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left">
                <div className="flex items-center gap-2"><IndicatorTypeCode codigo={r.codigo} /><span className="text-sm font-medium text-foreground">{r.nome}</span></div>
              </button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <IndicatorTypeUsage usage={r.usage} />
              <IndicatorTypeStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{medicoes(r)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
