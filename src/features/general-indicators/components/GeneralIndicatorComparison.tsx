import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatPercentBR, formatNumberBR } from '@/lib/formatters';
import { resolveIndicatorDefinition } from '../domain/indicatorDefinitions';
import { formatIndicatorValue } from '../domain/indicatorFormatting';
import type { ComparisonRow } from '../domain/indicatorComparison';

interface Props {
  rows: ComparisonRow[];
}

const pct = (v: number | null) => (v != null ? formatPercentBR(v, 1) : '—');
const varPct = (v: number | null) => (v != null ? `${v >= 0 ? '+' : ''}${formatNumberBR(v, 1)}%` : '—');
const varPP = (v: number | null) => (v != null ? `${v >= 0 ? '+' : ''}${formatNumberBR(v, 1)} p.p.` : '—');

/**
 * Tabela de comparação entre duas competências. Distingue explicitamente a
 * variação do REALIZADO (%) da variação do ATINGIMENTO (pontos percentuais).
 */
export function GeneralIndicatorComparison({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Indicador</TableHead>
            <TableHead className="text-right">Realizado anterior</TableHead>
            <TableHead className="text-right">Realizado atual</TableHead>
            <TableHead className="text-right">Variação realizado</TableHead>
            <TableHead className="text-right">Ating. anterior</TableHead>
            <TableHead className="text-right">Ating. atual</TableHead>
            <TableHead className="text-right">Variação (p.p.)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Sem indicadores para comparar.</TableCell></TableRow>
          ) : rows.map((r) => {
            const def = resolveIndicatorDefinition(r.codigo, r.label);
            return (
              <TableRow key={r.tipoId}>
                <TableCell className="text-sm font-medium">{r.label}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{formatIndicatorValue(r.realizadoAnterior, def, { compact: true })}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{formatIndicatorValue(r.realizadoAtual, def, { compact: true })}</TableCell>
                <TableCell className={cn('text-right text-sm font-medium tabular-nums', r.variacaoRealizado != null && (r.variacaoRealizado >= 0 ? 'text-success' : 'text-destructive'))}>{varPct(r.variacaoRealizado)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{pct(r.atingimentoAnterior)}</TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">{pct(r.atingimentoAtual)}</TableCell>
                <TableCell className={cn('text-right text-sm font-medium tabular-nums', r.variacaoPP != null && (r.variacaoPP >= 0 ? 'text-success' : 'text-destructive'))}>{varPP(r.variacaoPP)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
