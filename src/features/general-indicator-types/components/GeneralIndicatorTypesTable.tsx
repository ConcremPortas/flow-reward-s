import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatMonthYearBR } from '@/lib/dateTime';
import { GeneralIndicatorTypeCode } from './GeneralIndicatorTypeCode';
import { GeneralIndicatorTypeStatus } from './GeneralIndicatorTypeStatus';
import { GeneralIndicatorTypeUsage } from './GeneralIndicatorTypeUsage';
import { GeneralIndicatorTypeActionsMenu } from './GeneralIndicatorTypeActionsMenu';
import type { GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

export interface GeneralIndicatorTypeRowHandlers {
  onOpen: (r: GeneralIndicatorTypeRow) => void;
  onEdit: (r: GeneralIndicatorTypeRow) => void;
  onVerMedicoes: (r: GeneralIndicatorTypeRow) => void;
  onToggleStatus: (r: GeneralIndicatorTypeRow) => void;
  onDelete: (r: GeneralIndicatorTypeRow) => void;
}

function IndicadorCell({ row }: { row: GeneralIndicatorTypeRow }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{row.nome}</p>
      {row.descricao && row.descricao.trim() && <p className="truncate text-xs text-muted-foreground">{row.descricao}</p>}
    </div>
  );
}

export function GeneralIndicatorTypesTable({ rows, handlers }: { rows: GeneralIndicatorTypeRow[]; handlers: GeneralIndicatorTypeRowHandlers }) {
  const menu = (r: GeneralIndicatorTypeRow) => (
    <GeneralIndicatorTypeActionsMenu
      nome={r.nome} ativo={r.ativo} temMedicoes={r.usage.medicoes > 0}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onVerMedicoes={() => handlers.onVerMedicoes(r)}
      onToggleStatus={() => handlers.onToggleStatus(r)} onDelete={() => handlers.onDelete(r)}
    />
  );
  const ultima = (r: GeneralIndicatorTypeRow) => r.usage.ultimaCompetencia ? formatMonthYearBR(r.usage.ultimaCompetencia) : 'Sem medição';

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Indicador</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Última competência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum indicador encontrado para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><GeneralIndicatorTypeCode codigo={r.codigo} /></TableCell>
                <TableCell><IndicadorCell row={r} /></TableCell>
                <TableCell><GeneralIndicatorTypeUsage usage={r.usage} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{ultima(r)}</TableCell>
                <TableCell><StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></TableCell>
                <TableCell><GeneralIndicatorTypeStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum indicador encontrado.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left">
                <div className="flex items-center gap-2"><GeneralIndicatorTypeCode codigo={r.codigo} /><span className="text-sm font-medium text-foreground">{r.nome}</span></div>
              </button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <GeneralIndicatorTypeUsage usage={r.usage} />
              <StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Última: {ultima(r)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
