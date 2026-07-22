import { ArrowUpDown, Building2 } from 'lucide-react';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EmployeeStructuredJob } from './EmployeeStructuredJob';
import { EmployeeJobStatus } from './EmployeeJobStatus';
import { JobEmployeeActionsMenu, type EmployeeRowHandlers } from './JobEmployeeActionsMenu';
import type { JobEmployeeRow, SortKey, SortState } from '../types/job-employee.types';

interface Selection {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onTogglePage: (ids: string[], marcar: boolean) => void;
}

interface Props {
  rows: JobEmployeeRow[];
  temCargos: boolean;
  sort: SortState;
  onSort: (k: SortKey) => void;
  handlers: EmployeeRowHandlers;
  selection?: Selection;
}

/** Tabela compacta de colaboradores (desktop) + cards (mobile). Sem ações repetidas na linha. */
export function JobEmployeesTable({ rows, temCargos, sort, onSort, handlers, selection }: Props) {
  const pageIds = rows.map((r) => r.funcionario.id);
  const allSelected = selection != null && pageIds.length > 0 && pageIds.every((id) => selection.selected.has(id));
  const Th = ({ k, children, className }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cn('pb-2.5 pr-3 font-medium', className)}>
      {k ? (
        <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
          {children}
          <ArrowUpDown className={cn('h-3 w-3', sort.key === k ? 'text-foreground' : 'opacity-40')} />
        </button>
      ) : children}
    </th>
  );

  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              {selection && (
                <th className="pb-2.5 pr-2 w-8">
                  <Checkbox checked={allSelected} onCheckedChange={(v) => selection.onTogglePage(pageIds, !!v)} aria-label="Selecionar página" />
                </th>
              )}
              <Th k="nome">Colaborador</Th>
              <Th k="funcao">Função atual</Th>
              <Th k="cargo">Cargo estruturado</Th>
              <Th k="setor">Setor</Th>
              <Th k="enquadramento">Enquadramento</Th>
              <Th>Status</Th>
              <th className="pb-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.funcionario.id} className={cn('cursor-pointer border-b border-border/40 last:border-0 hover:bg-muted/40', !r.ativo && 'opacity-60')} onClick={() => handlers.onOpen(r)}>
                {selection && (
                  <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selection.selected.has(r.funcionario.id)} onCheckedChange={() => selection.onToggle(r.funcionario.id)} aria-label={`Selecionar ${r.funcionario.nome}`} />
                  </td>
                )}
                <td className="py-3 pr-3 font-medium text-foreground">{r.funcionario.nome}</td>
                <td className="py-3 pr-3">
                  <span className="text-sm text-foreground">{r.funcaoNome ?? '—'}</span>
                  <div className="text-[11px] text-muted-foreground">função (RH)</div>
                </td>
                <td className="py-3 pr-3"><EmployeeStructuredJob cargo={r.cargo} /></td>
                <td className="py-3 pr-3"><span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{r.setorNome ?? 'Sem setor'}</span></td>
                <td className="py-3 pr-3"><EmployeeJobStatus situacao={r.situacao} /></td>
                <td className="py-3 pr-3"><StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></td>
                <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <JobEmployeeActionsMenu row={r} temCargos={temCargos} handlers={handlers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet */}
      <div className="space-y-2.5 lg:hidden">
        {rows.map((r) => (
          <div key={r.funcionario.id} className={cn('rounded-lg border border-border/70 bg-card p-3.5', !r.ativo && 'opacity-60')} onClick={() => handlers.onOpen(r)}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{r.funcionario.nome}</h3>
              <div onClick={(e) => e.stopPropagation()}><JobEmployeeActionsMenu row={r} temCargos={temCargos} handlers={handlers} /></div>
            </div>
            <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
              <div><span className="text-foreground">{r.funcaoNome ?? '—'}</span> · função (RH)</div>
              <div>Cargo: {r.cargo ? r.cargo.nome : 'Não vinculado'}</div>
              <div>Setor: {r.setorNome ?? 'Sem setor'}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge variant={r.ativo ? 'success' : 'neutral'}>{r.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
              <EmployeeJobStatus situacao={r.situacao} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
