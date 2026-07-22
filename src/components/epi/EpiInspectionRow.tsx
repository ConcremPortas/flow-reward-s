import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { EpiComplianceControl } from './EpiComplianceControl';
import { cn } from '@/lib/utils';

const initialsOf = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface Props {
  funcionario: Funcionario;
  conforme: boolean;
  changed: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onChange: (conforme: boolean) => void;
}

export function EpiInspectionRow({ funcionario: f, conforme, changed, selected, onToggleSelect, onChange }: Props) {
  return (
    <TableRow className={cn(changed && 'bg-status-warning/[0.04]', !conforme && !changed && 'bg-destructive/[0.03]')}>
      <TableCell className="w-10">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Selecionar ${f.nome}`} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">{initialsOf(f.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{f.nome}</p>
            <p className="text-xs text-muted-foreground">{f.cpf || 'sem código'}{f.funcao?.nome ? ` · ${f.funcao.nome}` : ''}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-foreground">{f.setor?.nome || <span className="text-destructive">Sem setor</span>}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{f.empresa?.nome || '—'}</TableCell>
      <TableCell>
        <EpiComplianceControl conforme={conforme} changed={changed} onChange={onChange} label={`Situação de EPI de ${f.nome}`} />
      </TableCell>
    </TableRow>
  );
}
