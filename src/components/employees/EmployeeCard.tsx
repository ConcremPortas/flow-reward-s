import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { checkEmployeeCompletion } from '@/features/employees/domain/employeeCompletion';
import { getEmployeeEligibility } from '@/features/employees/domain/employeeEligibility';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import { EmployeeEligibilityBadge } from './EmployeeEligibilityBadge';
import { EmployeeActionsMenu } from './EmployeeActionsMenu';

const initialsOf = (nome: string) =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface EmployeeCardProps {
  funcionario: Funcionario;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenProfile: () => void;
  onEdit: () => void;
  onInactivate: () => void;
}

/** Cartão de funcionário para telas pequenas (substitui a tabela no mobile). */
export function EmployeeCard({ funcionario: f, selected, onToggleSelect, onOpenProfile, onEdit, onInactivate }: EmployeeCardProps) {
  const completion = checkEmployeeCompletion(f);
  const eligibility = getEmployeeEligibility(f);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5" onClick={onOpenProfile}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} onClick={(e) => e.stopPropagation()} aria-label={`Selecionar ${f.nome}`} className="mt-1" />
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(f.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{f.nome}</span>
              {!completion.complete && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <EmployeeActionsMenu funcionario={f} onView={onOpenProfile} onEdit={onEdit} onInactivate={onInactivate} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{f.cpf || 'sem código'} · {f.setor?.nome || 'Sem setor'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <EmployeeStatusBadge status={f.status} />
            <EmployeeEligibilityBadge status={eligibility} />
          </div>
        </div>
      </div>
    </div>
  );
}
