import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ComplianceMap } from '@/features/epi/types/epi.types';
import { EpiInspectionRow } from './EpiInspectionRow';
import { EpiInspectionCard } from './EpiInspectionCard';

interface Props {
  rows: Funcionario[];
  baseline: ComplianceMap;
  draft: ComplianceMap;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onChangeCompliance: (id: string, conforme: boolean) => void;
}

export function EpiInspectionTable({ rows, baseline, draft, isSelected, onToggleSelect, onToggleSelectAll, onChangeCompliance }: Props) {
  const ids = rows.map((f) => f.id);
  const allSelected = ids.length > 0 && ids.every((id) => isSelected(id));

  return (
    <>
      {/* Desktop / notebook */}
      <div className="hidden max-h-[560px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => onToggleSelectAll(ids)} aria-label="Selecionar todos desta página" />
              </TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="w-56">Situação do EPI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</TableCell></TableRow>
            ) : rows.map((f) => (
              <EpiInspectionRow
                key={f.id}
                funcionario={f}
                conforme={draft[f.id] ?? true}
                changed={(baseline[f.id] ?? true) !== (draft[f.id] ?? true)}
                selected={isSelected(f.id)}
                onToggleSelect={() => onToggleSelect(f.id)}
                onChange={(conforme) => onChangeCompliance(f.id, conforme)}
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
          <EpiInspectionCard
            key={f.id}
            funcionario={f}
            conforme={draft[f.id] ?? true}
            changed={(baseline[f.id] ?? true) !== (draft[f.id] ?? true)}
            onChange={(conforme) => onChangeCompliance(f.id, conforme)}
          />
        ))}
      </div>
    </>
  );
}
