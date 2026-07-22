import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { OccurrenceDraftMap } from '@/features/occurrences/types';
import { occurrenceRowStatusOf } from '@/features/occurrences/domain/occurrenceFilters';
import { OccurrenceEmployeeRow } from './OccurrenceEmployeeRow';
import { OccurrenceEmployeeCard } from './OccurrenceEmployeeCard';

interface Props {
  rows: Funcionario[];
  baseline: OccurrenceDraftMap;
  draft: OccurrenceDraftMap;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  onChangeFaltas: (id: string, value: number) => void;
  onChangeAdvertencias: (id: string, value: number) => void;
  onRestore: (id: string) => void;
}

const EMPTY_ENTRY = { faltas: 0, advertencias: 0 };

export function OccurrencesTable({
  rows, baseline, draft, isSelected, onToggleSelect, onToggleAll, allSelected, onChangeFaltas, onChangeAdvertencias, onRestore,
}: Props) {
  return (
    <>
      {/* Desktop / notebook */}
      <div className="hidden max-h-[560px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Selecionar todos" /></TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead className="w-40">Faltas</TableHead>
              <TableHead className="w-40">Advertências</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</TableCell></TableRow>
            ) : rows.map((f) => {
              const entry = draft[f.id] ?? EMPTY_ENTRY;
              const baselineEntry = baseline[f.id];
              const status = occurrenceRowStatusOf(f.id, { baseline, draft });
              return (
                <OccurrenceEmployeeRow
                  key={f.id}
                  funcionario={f}
                  entry={entry}
                  baselineEntry={baselineEntry}
                  status={status}
                  selected={isSelected(f.id)}
                  onToggleSelect={() => onToggleSelect(f.id)}
                  onChangeFaltas={(v) => onChangeFaltas(f.id, v)}
                  onChangeAdvertencias={(v) => onChangeAdvertencias(f.id, v)}
                  onRestore={() => onRestore(f.id)}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</p>
        ) : rows.map((f) => {
          const entry = draft[f.id] ?? EMPTY_ENTRY;
          const baselineEntry = baseline[f.id];
          const status = occurrenceRowStatusOf(f.id, { baseline, draft });
          return (
            <OccurrenceEmployeeCard
              key={f.id}
              funcionario={f}
              entry={entry}
              baselineEntry={baselineEntry}
              status={status}
              selected={isSelected(f.id)}
              onToggleSelect={() => onToggleSelect(f.id)}
              onChangeFaltas={(v) => onChangeFaltas(f.id, v)}
              onChangeAdvertencias={(v) => onChangeAdvertencias(f.id, v)}
              onRestore={() => onRestore(f.id)}
            />
          );
        })}
      </div>
    </>
  );
}
