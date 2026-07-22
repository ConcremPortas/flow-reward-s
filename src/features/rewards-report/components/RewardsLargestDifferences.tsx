import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { DifferenceRow } from '../types/rewards-report.types';

interface Props { rows: DifferenceRow[]; onOpen: (id: string) => void }

/** Maiores diferenças individuais. Clique abre a memória de cálculo. */
export function RewardsLargestDifferences({ rows, onOpen }: Props) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Funcionário</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Possível</TableHead>
            <TableHead className="text-right">Final</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhuma diferença individual.</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r.id)}>
              <TableCell className="text-sm font-medium">{r.nome}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.setor}</TableCell>
              <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrencyBRL(r.possivel)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{formatCurrencyBRL(r.final)}</TableCell>
              <TableCell className={`text-right text-sm font-semibold tabular-nums ${r.diferenca < 0 ? 'text-destructive' : 'text-success'}`}>{formatCurrencyBRL(r.diferenca)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
