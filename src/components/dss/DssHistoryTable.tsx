import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatDateBR } from '@/lib/dateTime';
import type { DssHistoryRow } from '@/features/dss/types';
import { DssActionsMenu } from './DssActionsMenu';

interface Props {
  rows: DssHistoryRow[];
  onOpenDetails: (row: DssHistoryRow) => void;
  onEdit: (row: DssHistoryRow) => void;
  onDuplicate: (row: DssHistoryRow) => void;
  onGenerateReport: (row: DssHistoryRow) => void;
  onDelete: (row: DssHistoryRow) => Promise<void> | void;
}

const situacao = (p: number | null): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (p == null) return { label: 'Sem dado', variant: 'neutral' };
  if (p >= 90) return { label: 'Boa', variant: 'success' };
  if (p >= 70) return { label: 'Atenção', variant: 'warning' };
  return { label: 'Crítica', variant: 'danger' };
};

export function DssHistoryTable({ rows, onOpenDetails, onEdit, onDuplicate, onGenerateReport, onDelete }: Props) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Data</TableHead>
            <TableHead>Tema</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="text-center">Presentes</TableHead>
            <TableHead className="text-center">Vinculados</TableHead>
            <TableHead className="text-center">Participação</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhum DSS encontrado para os filtros selecionados.</TableCell></TableRow>
          ) : rows.map((r) => {
            const s = situacao(r.participacao);
            return (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpenDetails(r)}>
                <TableCell className="text-sm">{formatDateBR(r.data_realizacao)}</TableCell>
                <TableCell className="text-sm font-medium">{r.titulo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.localNome || '—'}</TableCell>
                <TableCell className="text-center text-sm">{r.presentes}</TableCell>
                <TableCell className="text-center text-sm">{r.totalVinculado ?? '—'}</TableCell>
                <TableCell className="text-center text-sm font-semibold">{r.participacao != null ? `${r.participacao.toFixed(0)}%` : '—'}</TableCell>
                <TableCell><StatusBadge variant={s.variant}>{s.label}</StatusBadge></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DssActionsMenu
                    titulo={r.titulo}
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
