import { Building2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCNPJ } from '../domain/cnpjFormatting';
import { CompanyRegistrationStatus } from './CompanyRegistrationStatus';
import { CompanyStructureSummary } from './CompanyStructureSummary';
import { CompanyActionsMenu } from './CompanyActionsMenu';
import type { CompanyRow } from '../types/company.types';

export interface CompanyRowHandlers {
  onOpen: (r: CompanyRow) => void;
  onEdit: (r: CompanyRow) => void;
  onVerSetores: (r: CompanyRow) => void;
  onVerFuncionarios: (r: CompanyRow) => void;
  onDelete: (r: CompanyRow) => void;
}

function CnpjCell({ row }: { row: CompanyRow }) {
  if (!row.cnpjInformado) return <span className="text-sm text-muted-foreground">Não informado</span>;
  if (!row.cnpjValido) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 font-mono text-sm text-status-warning"><AlertTriangle className="h-3 w-3" /> CNPJ inválido</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">Dígitos verificadores inválidos: {formatCNPJ(row.cnpj)}. O valor não é alterado automaticamente.</TooltipContent>
      </Tooltip>
    );
  }
  return <span className="font-mono text-sm text-foreground">{formatCNPJ(row.cnpj)}</span>;
}

export function CompaniesTable({ rows, handlers }: { rows: CompanyRow[]; handlers: CompanyRowHandlers }) {
  const menu = (r: CompanyRow) => (
    <CompanyActionsMenu
      empresaNome={r.nome} onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)}
      onVerSetores={() => handlers.onVerSetores(r)} onVerFuncionarios={() => handlers.onVerFuncionarios(r)} onDelete={() => handlers.onDelete(r)}
    />
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Estrutura vinculada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Situação cadastral</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <span className="text-sm font-medium text-foreground">{r.nome}</span>
                  </div>
                </TableCell>
                <TableCell><CnpjCell row={r} /></TableCell>
                <TableCell><CompanyStructureSummary usage={r.usage} /></TableCell>
                <TableCell><StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></TableCell>
                <TableCell><CompanyRegistrationStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left">
                <span className="text-sm font-medium text-foreground">{r.nome}</span>
                <div className="mt-0.5"><CnpjCell row={r} /></div>
              </button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <CompanyStructureSummary usage={r.usage} />
              <CompanyRegistrationStatus status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
