import { AlertTriangle, GitCompare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { pluralizeBR, formatNumberBR } from '@/lib/formatters';
import { FunctionRegistrationStatus } from './FunctionRegistrationStatus';
import { FunctionUsage } from './FunctionUsage';
import { FunctionActionsMenu } from './FunctionActionsMenu';
import type { FunctionRow } from '../types/function.types';

export interface FunctionRowHandlers {
  onOpen: (r: FunctionRow) => void;
  onEdit: (r: FunctionRow) => void;
  onVerFuncionarios: (r: FunctionRow) => void;
  onCompare: (r: FunctionRow) => void;
  onDelete: (r: FunctionRow) => void;
}

function FuncaoCell({ row }: { row: FunctionRow }) {
  const temCorrespondencia = row.status.status === 'possivel_correspondencia';
  const temRevisar = row.status.status === 'revisar';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{row.nome}</span>
      {temCorrespondencia && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-status-warning"><GitCompare className="h-3 w-3" /> Semelhante</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">{row.status.motivos[0] ?? 'Há função com nome semelhante.'}</TooltipContent>
        </Tooltip>
      )}
      {!temCorrespondencia && temRevisar && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-status-warning"><AlertTriangle className="h-3 w-3" /> Revisar</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">{row.status.motivos[0] ?? 'Revisar formatação do nome.'}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const funcionariosLabel = (r: FunctionRow) => r.usage.funcionarios > 0
  ? pluralizeBR(r.usage.funcionarios, 'funcionário', 'funcionários')
  : 'Nenhum vínculo';

export function FunctionsTable({ rows, handlers }: { rows: FunctionRow[]; handlers: FunctionRowHandlers }) {
  const menu = (r: FunctionRow) => (
    <FunctionActionsMenu
      funcaoNome={r.nome}
      temCorrespondencia={r.status.status === 'possivel_correspondencia'}
      onDetails={() => handlers.onOpen(r)}
      onEdit={() => handlers.onEdit(r)}
      onVerFuncionarios={() => handlers.onVerFuncionarios(r)}
      onCompare={() => handlers.onCompare(r)}
      onDelete={() => handlers.onDelete(r)}
    />
  );

  return (
    <>
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Funcionários</TableHead>
              <TableHead className="text-right">Setores</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhuma função encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><FuncaoCell row={r} /></TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.usage.funcionarios > 0 ? formatNumberBR(r.usage.funcionarios) : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatNumberBR(r.usage.setores)}</TableCell>
                <TableCell><FunctionUsage usage={r.usage} /></TableCell>
                <TableCell><FunctionRegistrationStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma função encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><FuncaoCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{funcionariosLabel(r)}</span>
              <FunctionRegistrationStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground"><FunctionUsage usage={r.usage} /> · {pluralizeBR(r.usage.setores, 'setor', 'setores')}</p>
          </div>
        ))}
      </div>
    </>
  );
}
