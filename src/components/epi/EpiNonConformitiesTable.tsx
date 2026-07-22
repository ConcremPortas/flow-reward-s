import { Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiNonConformityRow } from '@/features/epi/types/epi.types';

const initialsOf = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
const fmtDate = (d: string) => formatDateBR(d);

interface Props {
  rows: EpiNonConformityRow[];
  onOpenDetails: (row: EpiNonConformityRow) => void;
}

export function EpiNonConformitiesTable({ rows, onOpenDetails }: Props) {
  return (
    <div className="overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Funcionário</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-center">Ocorrências</TableHead>
            <TableHead>Última ocorrência</TableHead>
            <TableHead className="text-center">Reincidência</TableHead>
            <TableHead className="w-16 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhuma não conformidade encontrada.</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.funcionarioId ?? r.nome}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">{initialsOf(r.nome)}</AvatarFallback>
                  </Avatar>
                  <p className="truncate text-sm font-medium text-foreground">{r.nome}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-foreground">{r.setorNome || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.empresaNome || '—'}</TableCell>
              <TableCell className="text-center">
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">{r.ocorrencias}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(r.ultimaOcorrencia)}</TableCell>
              <TableCell className="text-center">
                {r.reincidente ? <Badge variant="destructive">Reincidente</Badge> : <span className="text-xs text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenDetails(r)} aria-label={`Ver detalhes de ${r.nome}`}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
