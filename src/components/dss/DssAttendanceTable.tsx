import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { PresenceMap } from '@/features/dss/types';
import { DssAttendanceRow } from './DssAttendanceRow';
import { DssAttendanceCard } from './DssAttendanceCard';

interface Props {
  rows: Funcionario[];
  baseline: PresenceMap;
  draft: PresenceMap;
  onChangePresence: (id: string, presente: boolean) => void;
}

export function DssAttendanceTable({ rows, baseline, draft, onChangePresence }: Props) {
  return (
    <>
      {/* Desktop / notebook */}
      <div className="hidden max-h-[520px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>Funcionário</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="w-48">Presença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</TableCell></TableRow>
            ) : rows.map((f) => (
              <DssAttendanceRow
                key={f.id}
                funcionario={f}
                presente={draft[f.id] ?? false}
                changed={(baseline[f.id] ?? false) !== (draft[f.id] ?? false)}
                onChange={(presente) => onChangePresence(f.id, presente)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</p>
        ) : rows.map((f) => (
          <DssAttendanceCard
            key={f.id}
            funcionario={f}
            presente={draft[f.id] ?? false}
            changed={(baseline[f.id] ?? false) !== (draft[f.id] ?? false)}
            onChange={(presente) => onChangePresence(f.id, presente)}
          />
        ))}
      </div>
    </>
  );
}
