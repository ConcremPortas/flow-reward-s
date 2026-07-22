import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { pluralizeBR } from '@/lib/formatters';
import { SectorLeadership } from './SectorLeadership';
import { SectorRegistrationStatus } from './SectorRegistrationStatus';
import { SectorActionsMenu } from './SectorActionsMenu';
import type { SectorRow } from '../types/sector.types';

export interface SectorRowHandlers {
  onOpen: (r: SectorRow) => void;
  onEdit: (r: SectorRow) => void;
  onFuncionarios: (r: SectorRow) => void;
  onProducao: (r: SectorRow) => void;
  onIndicadores: (r: SectorRow) => void;
  onDelete: (r: SectorRow) => void;
}

function SetorCell({ row }: { row: SectorRow }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{row.nome}</p>
      <p className="truncate text-xs text-muted-foreground">{row.descricaoDisplay.show ? row.descricaoDisplay.text : 'Sem descrição'}</p>
    </div>
  );
}

const vinculos = (r: SectorRow) => pluralizeBR(r.links.funcionarios, 'funcionário', 'funcionários');

export function SectorsTable({ rows, handlers }: { rows: SectorRow[]; handlers: SectorRowHandlers }) {
  const menu = (r: SectorRow) => (
    <SectorActionsMenu setorNome={r.nome}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)}
      onFuncionarios={() => handlers.onFuncionarios(r)} onProducao={() => handlers.onProducao(r)}
      onIndicadores={() => handlers.onIndicadores(r)} onDelete={() => handlers.onDelete(r)} />
  );

  return (
    <>
      {/* Desktop / tablet — tabela com 1ª coluna sticky */}
      <div className="hidden max-h-[620px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/95">Setor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Liderança</TableHead>
              <TableHead className="text-right">Vínculos</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum setor encontrado para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell className="sticky left-0 z-10 bg-card"><SetorCell row={r} /></TableCell>
                <TableCell className="text-sm">{r.empresaNome ?? <span className="text-muted-foreground">Não vinculado</span>}</TableCell>
                <TableCell><SectorLeadership row={r} /></TableCell>
                <TableCell className="text-right text-sm tabular-nums">{vinculos(r)}</TableCell>
                <TableCell><SectorRegistrationStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum setor encontrado.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><SetorCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{r.empresaNome ?? 'Sem empresa'} · {vinculos(r)}</p>
            <div className="mt-2"><SectorLeadership row={r} /></div>
            <div className="mt-2"><SectorRegistrationStatus status={r.status} /></div>
          </div>
        ))}
      </div>
    </>
  );
}
