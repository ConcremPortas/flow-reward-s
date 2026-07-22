import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { GroupRow } from '../types/rewards-report.types';
import type { GroupSort } from '../domain/rewardsReportGrouping';

interface Props {
  rows: GroupRow[];
  firstColLabel: string;   // "Setor" | "Base"
  sort?: GroupSort;
  onSortChange?: (s: GroupSort) => void;
  onRowClick?: (row: GroupRow) => void;
  compact?: boolean;       // esconde colunas de contexto quando estreito
}

/** Tabela de agrupamento reutilizável (por setor / por base / diferenças). */
export function RewardsGroupTable({ rows, firstColLabel, sort, onSortChange, onRowClick, compact }: Props) {
  return (
    <div className="space-y-2">
      {onSortChange && (
        <div className="flex justify-end">
          <Select value={sort} onValueChange={(v) => onSortChange(v as GroupSort)}>
            <SelectTrigger className="h-8 w-[190px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="valor">Maior valor</SelectItem>
              <SelectItem value="diferenca">Maior diferença</SelectItem>
              <SelectItem value="atingimento">Menor atingimento</SelectItem>
              <SelectItem value="quantidade">Quantidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="max-h-[420px] overflow-auto rounded-lg border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>{firstColLabel}</TableHead>
              <TableHead className="text-right">Result.</TableHead>
              {!compact && <TableHead className="text-right">Únicos</TableHead>}
              {!compact && <TableHead className="text-right">Possível</TableHead>}
              <TableHead className="text-right">Final</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
              <TableHead className="text-right">Ating.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={compact ? 5 : 7} className="py-8 text-center text-sm text-muted-foreground">Sem dados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.key} className={cn(onRowClick && 'cursor-pointer hover:bg-muted/40')} onClick={() => onRowClick?.(r)}>
                <TableCell className="text-sm font-medium">{r.label}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.resultados}</TableCell>
                {!compact && <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{r.funcionariosUnicos}</TableCell>}
                {!compact && <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrencyBRL(r.possivel)}</TableCell>}
                <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(r.final)}</TableCell>
                <TableCell className={cn('text-right text-sm font-medium tabular-nums', r.diferenca < 0 ? 'text-destructive' : r.diferenca > 0 ? 'text-success' : 'text-muted-foreground')}>{formatCurrencyBRL(r.diferenca)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.atingimento != null ? formatPercentBR(r.atingimento, 1) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
