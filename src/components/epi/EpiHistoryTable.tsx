import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';
import { EpiActionsMenu } from './EpiActionsMenu';

interface Props {
  rows: EpiAuditGroupEnriched[];
  onOpenDetails: (row: EpiAuditGroupEnriched) => void;
  onEdit: (row: EpiAuditGroupEnriched) => void;
  onDuplicate: (row: EpiAuditGroupEnriched) => void;
  onGenerateReport: (row: EpiAuditGroupEnriched) => void;
  onDelete: (row: EpiAuditGroupEnriched) => Promise<void> | void;
}

const situacao = (taxa: number | null): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (taxa == null) return { label: 'Sem dado', variant: 'neutral' };
  if (taxa >= 90) return { label: 'Boa', variant: 'success' };
  if (taxa >= 70) return { label: 'Atenção', variant: 'warning' };
  return { label: 'Crítica', variant: 'danger' };
};

export function EpiHistoryTable({ rows, onOpenDetails, onEdit, onDuplicate, onGenerateReport, onDelete }: Props) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Data</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="text-center">Auditados</TableHead>
            <TableHead className="text-center">Conformes</TableHead>
            <TableHead className="text-center">Não conformes</TableHead>
            <TableHead className="text-center">Taxa</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhuma auditoria encontrada para os filtros selecionados.</TableCell></TableRow>
          ) : rows.map((r) => {
            const s = situacao(r.taxaConformidade);
            return (
              <TableRow key={r.auditoriaId} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDetails(r)}>
                <TableCell className="text-sm">{formatDateBR(r.data)}</TableCell>
                <TableCell className="text-sm font-medium">{r.titulo}</TableCell>
                <TableCell className="text-center text-sm">{r.totalAuditados}</TableCell>
                <TableCell className="text-center text-sm">{r.conformes}</TableCell>
                <TableCell className="text-center text-sm">{r.naoConformes}</TableCell>
                <TableCell className="text-center text-sm font-semibold">{r.taxaConformidade != null ? `${r.taxaConformidade.toFixed(0)}%` : '—'}</TableCell>
                <TableCell><StatusBadge variant={s.variant}>{s.label}</StatusBadge></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <EpiActionsMenu
                    titulo={r.titulo}
                    totalAuditados={r.totalAuditados}
                    onView={() => onOpenDetails(r)}
                    onEdit={() => onEdit(r)}
                    onDuplicate={() => onDuplicate(r)}
                    onGenerateReport={() => onGenerateReport(r)}
                    onDelete={() => onDelete(r)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
