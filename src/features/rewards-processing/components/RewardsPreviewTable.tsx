import { PanelRightOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { RewardResult } from '../types/rewards-processing.types';

interface Props {
  rows: RewardResult[];
  onOpen: (e: RewardResult) => void;
}

/** Tabela da prévia — conceitos do motor (nota final, faixa, bônus, situação). */
export function RewardsPreviewTable({ rows, onOpen }: Props) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Funcionário</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Nota final</TableHead>
            <TableHead>Faixa</TableHead>
            <TableHead className="text-right">Bônus calculado</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="w-10 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário para os filtros selecionados.</TableCell></TableRow>
          ) : rows.map(e => (
            <TableRow key={e.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(e)}>
              <TableCell className="text-sm font-medium">{e.nome}{e.flags.length > 0 && <span className="ml-1 text-status-warning">•</span>}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{e.setor}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{e.categoria}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{formatPercentBR(e.nota_geral * 100, 1)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{e.faixa}</TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(e.bonus_alcancado)}</TableCell>
              <TableCell>{e.bonus_alcancado > 0 ? <StatusBadge variant="success">Com bônus</StatusBadge> : <StatusBadge variant="neutral">Sem bônus</StatusBadge>}</TableCell>
              <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpen(e)} aria-label={`Memória de cálculo de ${e.nome}`}><PanelRightOpen className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
