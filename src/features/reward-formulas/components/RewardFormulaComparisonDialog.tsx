import { useMemo, useState } from 'react';
import { Pencil, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatPercentBR, pluralizeBR } from '@/lib/formatters';
import { diffWeights } from '../domain/rewardFormulaComparison';
import { RewardFormulaTotal } from './RewardFormulaTotal';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Props {
  a: RewardFormulaRow | null;
  all: RewardFormulaRow[];
  onOpenChange: (open: boolean) => void;
  onEdit: (r: RewardFormulaRow) => void;
  onDuplicar: (r: RewardFormulaRow) => void;
}

const pct = (n: number) => formatPercentBR(n, Number.isInteger(n) ? 0 : 1);

export function RewardFormulaComparisonDialog({ a, all, onOpenChange, onEdit, onDuplicar }: Props) {
  const [bId, setBId] = useState<string>('');
  const candidatos = useMemo(() => all.filter(f => f.id !== a?.id), [all, a]);
  const b = candidatos.find(f => f.id === bId) ?? null;
  if (!a) return null;

  const diff = b ? diffWeights(a.weights, b.weights) : [];

  return (
    <Dialog open={!!a} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparar fórmulas</DialogTitle>
          <DialogDescription>Comparação lado a lado dos critérios. Nenhuma alteração é feita.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate rounded-lg border border-border/70 bg-muted/30 px-3 py-2 font-medium text-foreground">{a.nome}</span>
          <span className="text-muted-foreground">×</span>
          <Select value={bId} onValueChange={setBId}>
            <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Selecione a fórmula B" /></SelectTrigger>
            <SelectContent>{candidatos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {b ? (
          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SideInfo row={a} />
              <SideInfo row={b} />
            </div>

            <div className="overflow-hidden rounded-lg border border-border/70">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 text-left"><th className="px-3 py-1.5 font-medium">Critério</th><th className="px-3 py-1.5 text-right font-medium">A</th><th className="px-3 py-1.5 text-right font-medium">B</th></tr></thead>
                <tbody>
                  {diff.map(d => (
                    <tr key={d.key} className={cn('border-t border-border/50', d.changed && 'bg-status-warning/5')}>
                      <td className="px-3 py-1.5 text-foreground">{d.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{pct(d.a)}</td>
                      <td className={cn('px-3 py-1.5 text-right tabular-nums', d.changed && 'font-semibold text-status-warning')}>{pct(d.b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Selecione a segunda fórmula para comparar.</p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onEdit(a)}><Pencil className="h-4 w-4" /> Editar A</Button>
          {b && <Button variant="outline" className="gap-1.5" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /> Editar B</Button>}
          <Button variant="outline" className="gap-1.5" onClick={() => onDuplicar(a)}><Copy className="h-4 w-4" /> Duplicar A</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SideInfo({ row }: { row: RewardFormulaRow }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="truncate text-sm font-semibold text-foreground">{row.nome}</p>
      <p className="text-xs text-muted-foreground">{row.categoriaNome ?? '—'} · {row.baseNome ?? '—'}</p>
      <div className="mt-1.5"><RewardFormulaTotal validation={row.validation} /></div>
      <p className="mt-1 text-xs text-muted-foreground">{row.usage.emUso ? pluralizeBR(row.usage.funcionarios, 'funcionário', 'funcionários') : 'Sem vínculo'}</p>
    </div>
  );
}
