import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPercentBR, pluralizeBR } from '@/lib/formatters';
import { topCriteria } from '../domain/rewardFormulaWeights';
import { RewardFormulaStatus } from './RewardFormulaStatus';
import { RewardFormulaTotal } from './RewardFormulaTotal';
import { RewardFormulaWeightDistribution } from './RewardFormulaWeightDistribution';
import { RewardFormulaActionsMenu } from './RewardFormulaActionsMenu';
import type { RewardFormulaRow } from '../types/reward-formula.types';

export interface RewardFormulaRowHandlers {
  onOpen: (r: RewardFormulaRow) => void;
  onEdit: (r: RewardFormulaRow) => void;
  onDuplicar: (r: RewardFormulaRow) => void;
  onComparar: (r: RewardFormulaRow) => void;
  onVerUtilizacao: (r: RewardFormulaRow) => void;
  onDelete: (r: RewardFormulaRow) => void;
}

const pct = (n: number) => formatPercentBR(n, Number.isInteger(n) ? 0 : 1);

function Aplicacao({ row }: { row: RewardFormulaRow }) {
  if (!row.categoriaNome && !row.baseNome) return <span className="text-xs text-muted-foreground">Sem categoria/base</span>;
  return <span className="text-sm text-foreground">{row.categoriaNome ?? '—'} <span className="text-muted-foreground">·</span> {row.baseNome ?? '—'}</span>;
}

function Criterios({ row }: { row: RewardFormulaRow }) {
  const { top, rest } = topCriteria(row.weights, 3);
  if (top.length === 0) return <span className="text-xs text-muted-foreground">Sem pesos</span>;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
        {top.map(e => <span key={e.key} className="text-foreground">{e.short} <span className="font-semibold tabular-nums">{pct(e.value)}</span></span>)}
        {rest > 0 && <span className="text-muted-foreground">+{rest} critério(s)</span>}
      </div>
      <RewardFormulaWeightDistribution weights={row.weights} />
    </div>
  );
}

export function RewardFormulasTable({ rows, handlers }: { rows: RewardFormulaRow[]; handlers: RewardFormulaRowHandlers }) {
  const menu = (r: RewardFormulaRow) => (
    <RewardFormulaActionsMenu
      nome={r.nome} temUso={r.usage.emUso}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onDuplicar={() => handlers.onDuplicar(r)}
      onComparar={() => handlers.onComparar(r)} onVerUtilizacao={() => handlers.onVerUtilizacao(r)} onDelete={() => handlers.onDelete(r)}
    />
  );
  const util = (r: RewardFormulaRow) => r.usage.emUso ? pluralizeBR(r.usage.funcionarios, 'funcionário', 'funcionários') : 'Sem vínculo';

  return (
    <>
      <div className="hidden max-h-[620px] overflow-auto rounded-xl border border-border/70 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>Fórmula</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead className="w-[280px]">Critérios principais</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhuma fórmula encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell>
                  <p className="text-sm font-medium text-foreground">{r.nome}</p>
                  {r.descricao && r.descricao.trim() && <p className="max-w-[220px] truncate text-xs text-muted-foreground">{r.descricao}</p>}
                </TableCell>
                <TableCell><Aplicacao row={r} /></TableCell>
                <TableCell><Criterios row={r} /></TableCell>
                <TableCell className="text-right"><RewardFormulaTotal validation={r.validation} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{util(r)}</TableCell>
                <TableCell><RewardFormulaStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/tablet — cards */}
      <div className="space-y-2.5 lg:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma fórmula encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">{r.nome}</p>
                <p className="text-xs text-muted-foreground"><Aplicacao row={r} /></p>
              </button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2"><Criterios row={r} /></div>
            <div className="mt-2 flex items-center justify-between">
              <RewardFormulaTotal validation={r.validation} />
              <RewardFormulaStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{util(r)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
