import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPercentBR } from '@/lib/formatters';
import type { CriterionImpact } from '../types/rewards-report.types';

/**
 * Impacto OPERACIONAL por critério. Não há decomposição financeira rastreável da
 * diferença (o motor pondera notas), então mostramos impacto operacional — sem
 * inventar valor monetário por critério.
 */
export function RewardsImpactByCriterion({ impactos }: { impactos: CriterionImpact[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">A diferença financeira não é decomponível por critério de forma rastreável. Abaixo, o impacto operacional (resultados com nota abaixo de 100%).</p>
      <div className="overflow-x-auto rounded-lg border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Critério</TableHead>
              <TableHead className="text-right">Resultados impactados</TableHead>
              <TableHead className="text-right">Funcionários únicos</TableHead>
              <TableHead className="text-right">Setores</TableHead>
              <TableHead className="text-right">Nota média</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {impactos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Sem critérios com dados.</TableCell></TableRow>
            ) : impactos.map(i => (
              <TableRow key={i.key}>
                <TableCell className="text-sm font-medium">{i.label}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{i.resultadosImpactados}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{i.funcionariosUnicos}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{i.setores}</TableCell>
                <TableCell className={`text-right text-sm font-medium tabular-nums ${i.notaMedia == null ? 'text-muted-foreground' : i.notaMedia >= 1 ? 'text-success' : i.notaMedia >= 0.9 ? 'text-status-warning' : 'text-destructive'}`}>
                  {i.notaMedia != null ? formatPercentBR(i.notaMedia * 100, 1) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
