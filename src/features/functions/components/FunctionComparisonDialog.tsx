import { Pencil, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';
import { classifyPair } from '../domain/functionSimilarity';
import { FunctionRegistrationStatus } from './FunctionRegistrationStatus';
import type { FunctionRow } from '../types/function.types';

export interface ComparisonPair { a: FunctionRow; b: FunctionRow }

interface Props {
  pair: ComparisonPair | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (r: FunctionRow) => void;
  onVerFuncionarios: (r: FunctionRow) => void;
}

/** Comparação lado a lado de duas funções semelhantes. Não mescla nem move dados. */
export function FunctionComparisonDialog({ pair, onOpenChange, onEdit, onVerFuncionarios }: Props) {
  if (!pair) return null;
  const { a, b } = pair;
  const cls = classifyPair(a.nome, b.nome);
  const diffs = cls?.diffs ?? [];

  return (
    <Dialog open={!!pair} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparar funções</DialogTitle>
          <DialogDescription>Revisão de nomenclatura. Nenhuma alteração é feita automaticamente.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Side row={a} label="Função A" onVerFuncionarios={onVerFuncionarios} />
          <Side row={b} label="Função B" onVerFuncionarios={onVerFuncionarios} />
        </div>

        <div className="rounded-xl border border-status-warning/40 bg-status-warning/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-status-warning">Diferenças identificadas</p>
          {diffs.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {diffs.map(d => <span key={d} className="rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">{d}</span>)}
            </div>
          ) : <p className="mt-1 text-sm text-muted-foreground">Sem diferença de formatação evidente.</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onEdit(a)}><Pencil className="h-4 w-4" /> Editar A</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /> Editar B</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Side({ row, label, onVerFuncionarios }: { row: FunctionRow; label: string; onVerFuncionarios: (r: FunctionRow) => void }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{row.nome}</p>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{row.id}</p>
      <dl className="mt-2 space-y-1 text-sm">
        <Line k="Funcionários" v={formatNumberBR(row.usage.funcionarios)} />
        <Line k="Setores" v={formatNumberBR(row.usage.setores)} />
        <Line k="Histórico" v={formatNumberBR(row.usage.resultadosHistoricos)} />
      </dl>
      <div className="mt-2"><FunctionRegistrationStatus status={row.status} /></div>
      <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1.5 px-2 text-xs" onClick={() => onVerFuncionarios(row)}>
        <Users className="h-3.5 w-3.5" /> Ver funcionários
      </Button>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="tabular-nums text-foreground">{v}</dd></div>;
}
