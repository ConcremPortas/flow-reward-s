import { MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import { DssLocationCoverage } from './DssLocationCoverage';
import { DssLocationStatus } from './DssLocationStatus';
import { DssLocationActionsMenu } from './DssLocationActionsMenu';
import type { DssLocationRow } from '../types/dss-location.types';

export interface DssLocationRowHandlers {
  onOpen: (r: DssLocationRow) => void;
  onEdit: (r: DssLocationRow) => void;
  onVerFuncionarios: (r: DssLocationRow) => void;
  onRegistrarDss: (r: DssLocationRow) => void;
  onVerHistorico: (r: DssLocationRow) => void;
  onDelete: (r: DssLocationRow) => void;
}

function LocalCell({ row }: { row: DssLocationRow }) {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{row.nome}</p>
        {row.mostrarDescricao && <p className="truncate text-xs text-muted-foreground">{row.descricao}</p>}
      </div>
    </div>
  );
}

export function DssLocationsTable({ rows, handlers }: { rows: DssLocationRow[]; handlers: DssLocationRowHandlers }) {
  const menu = (r: DssLocationRow) => (
    <DssLocationActionsMenu
      nome={r.nome} temFuncionarios={r.usage.funcionarios > 0} temHistorico={r.usage.temHistorico}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onVerFuncionarios={() => handlers.onVerFuncionarios(r)}
      onRegistrarDss={() => handlers.onRegistrarDss(r)} onVerHistorico={() => handlers.onVerHistorico(r)} onDelete={() => handlers.onDelete(r)}
    />
  );
  const ultimo = (r: DssLocationRow) => r.usage.ultimaData ? formatDateBR(r.usage.ultimaData) : 'Nenhum DSS realizado';

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Local</TableHead>
              <TableHead>Funcionários</TableHead>
              <TableHead className="text-right">DSS realizados</TableHead>
              <TableHead>Último DSS</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum local encontrado para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><LocalCell row={r} /></TableCell>
                <TableCell><DssLocationCoverage usage={r.usage} /></TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{r.usage.dssRealizados > 0 ? formatNumberBR(r.usage.dssRealizados) : '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ultimo(r)}</TableCell>
                <TableCell><DssLocationStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum local encontrado.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><LocalCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <DssLocationCoverage usage={r.usage} />
              <DssLocationStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{formatNumberBR(r.usage.dssRealizados)} DSS · último: {ultimo(r)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
