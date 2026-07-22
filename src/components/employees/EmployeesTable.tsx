import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { EmployeeRow } from './EmployeeRow';
import { EmployeeCard } from './EmployeeCard';

interface EmployeesTableProps {
  rows: Funcionario[];
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  onOpenProfile: (f: Funcionario) => void;
  onEdit: (f: Funcionario) => void;
  onInactivate: (f: Funcionario) => void;
}

export function EmployeesTable({ rows, isSelected, onToggleSelect, onToggleAll, allSelected, onOpenProfile, onEdit, onInactivate }: EmployeesTableProps) {
  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Selecionar todos" /></TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Setor e Função</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Premiação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado.</TableCell></TableRow>
            ) : rows.map((f) => (
              <EmployeeRow
                key={f.id}
                funcionario={f}
                selected={isSelected(f.id)}
                onToggleSelect={() => onToggleSelect(f.id)}
                onOpenProfile={() => onOpenProfile(f)}
                onEdit={() => onEdit(f)}
                onInactivate={() => onInactivate(f)}
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
          <EmployeeCard
            key={f.id}
            funcionario={f}
            selected={isSelected(f.id)}
            onToggleSelect={() => onToggleSelect(f.id)}
            onOpenProfile={() => onOpenProfile(f)}
            onEdit={() => onEdit(f)}
            onInactivate={() => onInactivate(f)}
          />
        ))}
      </div>
    </>
  );
}
