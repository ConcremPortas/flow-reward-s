import { AlertTriangle } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { checkEmployeeCompletion } from '@/features/employees/domain/employeeCompletion';
import { getEmployeeEligibility } from '@/features/employees/domain/employeeEligibility';
import { formatTenure } from '@/features/employees/domain/tenure';
import { formatDateBR } from '@/lib/dateTime';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import { EmployeeEligibilityBadge } from './EmployeeEligibilityBadge';
import { EmployeeActionsMenu } from './EmployeeActionsMenu';

const initialsOf = (nome: string) =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface EmployeeRowProps {
  funcionario: Funcionario;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenProfile: () => void;
  onEdit: () => void;
  onInactivate: () => void;
}

export function EmployeeRow({ funcionario: f, selected, onToggleSelect, onOpenProfile, onEdit, onInactivate }: EmployeeRowProps) {
  const completion = checkEmployeeCompletion(f);
  const eligibility = getEmployeeEligibility(f);
  const tenure = formatTenure(f.data_admissao);

  return (
    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={onOpenProfile}>
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Selecionar ${f.nome}`} />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">{initialsOf(f.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-foreground">{f.nome}</span>
              {!completion.complete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Pendente: {completion.missing.join(', ')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{f.cpf || 'sem código'}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-foreground">{f.setor?.nome || <span className="text-destructive">Sem setor</span>}</div>
        <div className="text-xs text-muted-foreground">{f.funcao?.nome || 'Sem função'}</div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-foreground">{f.empresa?.nome || '—'}</div>
        <div className="text-xs text-muted-foreground">
          {f.data_admissao ? formatDateBR(f.data_admissao) : 'sem admissão'}
          {tenure ? ` · ${tenure}` : ''}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-foreground">{f.categoria?.nome || '—'}</div>
        <div className="text-xs text-muted-foreground">{f.faixa?.nome || f.base_premiacao?.nome || '—'}</div>
      </TableCell>

      <TableCell><EmployeeEligibilityBadge status={eligibility} /></TableCell>
      <TableCell><EmployeeStatusBadge status={f.status} /></TableCell>

      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <EmployeeActionsMenu funcionario={f} onView={onOpenProfile} onEdit={onEdit} onInactivate={onInactivate} />
      </TableCell>
    </TableRow>
  );
}
