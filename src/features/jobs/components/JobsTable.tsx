import { Briefcase, Building2, Layers } from 'lucide-react';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { JobSituacaoBadge } from './JobSituacaoBadge';
import { JobSalaryRange } from './JobSalaryRange';
import { JobActionsMenu, type JobRowHandlers } from './JobActionsMenu';
import type { JobRow } from '../types/job.types';

interface Props {
  rows: JobRow[];
  autorizadoSalario: boolean;
  handlers: JobRowHandlers;
}

/**
 * Tabela de cargos (desktop) + cards (mobile). Sem ações destrutivas na linha —
 * tudo via menu contextual. A linha inteira abre o drawer.
 */
export function JobsTable({ rows, autorizadoSalario, handlers }: Props) {
  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="pb-2.5 pr-3 font-medium">Cargo</th>
              <th className="pb-2.5 pr-3 font-medium">Estrutura</th>
              <th className="pb-2.5 pr-3 font-medium">Ocupação</th>
              <th className="pb-2.5 pr-3 font-medium">Faixa salarial</th>
              <th className="pb-2.5 pr-3 font-medium">Status</th>
              <th className="pb-2.5 pr-3 font-medium">Situação</th>
              <th className="pb-2.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.cargo.id}
                className={cn('cursor-pointer border-b border-border/40 last:border-0 hover:bg-muted/40', !r.cargo.ativo && 'opacity-60')}
                onClick={() => handlers.onOpen(r)}
              >
                <td className="py-3 pr-3">
                  <div className="font-medium text-foreground">{r.cargo.nome}</div>
                  {r.cargo.missao && <div className="mt-0.5 line-clamp-1 max-w-xs text-xs text-muted-foreground">{r.cargo.missao}</div>}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />{r.semNivel ? 'Sem nível' : `Nível ${r.cargo.nivel_hierarquico}`}</span>
                    <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{r.cargo.concremrh_setores?.nome ?? 'Sem setor'}</span>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <StatusBadge variant={r.ocupantes > 0 ? 'info' : 'neutral'}>{formatNumberBR(r.ocupantes)} colaborador(es)</StatusBadge>
                </td>
                <td className="py-3 pr-3"><JobSalaryRange cargo={r.cargo} autorizado={autorizadoSalario} /></td>
                <td className="py-3 pr-3"><StatusBadge variant={r.cargo.ativo ? 'success' : 'neutral'}>{r.cargo.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></td>
                <td className="py-3 pr-3"><JobSituacaoBadge situacao={r.situacao} /></td>
                <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <JobActionsMenu row={r} autorizadoSalario={autorizadoSalario} handlers={handlers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((r) => (
          <div key={r.cargo.id} className={cn('rounded-lg border border-border/70 bg-card p-3.5', !r.cargo.ativo && 'opacity-60')} onClick={() => handlers.onOpen(r)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{r.cargo.nome}</h3>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <JobActionsMenu row={r} autorizadoSalario={autorizadoSalario} handlers={handlers} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{r.semNivel ? 'Sem nível' : `Nível ${r.cargo.nivel_hierarquico}`}</span>
              <span>·</span>
              <span>{r.cargo.concremrh_setores?.nome ?? 'Sem setor'}</span>
              <span>·</span>
              <span>{formatNumberBR(r.ocupantes)} colaborador(es)</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge variant={r.cargo.ativo ? 'success' : 'neutral'}>{r.cargo.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
              <JobSituacaoBadge situacao={r.situacao} />
            </div>
            <div className="mt-2"><JobSalaryRange cargo={r.cargo} autorizado={autorizadoSalario} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
