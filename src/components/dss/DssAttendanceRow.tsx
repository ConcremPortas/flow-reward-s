import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { DssPresenceControl } from './DssPresenceControl';
import { cn } from '@/lib/utils';

const initialsOf = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface Props {
  funcionario: Funcionario;
  presente: boolean;
  changed: boolean;
  onChange: (presente: boolean) => void;
}

export function DssAttendanceRow({ funcionario: f, presente, changed, onChange }: Props) {
  return (
    <TableRow className={cn(changed && 'bg-status-warning/[0.04]')}>
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
        <DssPresenceControl presente={presente} changed={changed} onChange={onChange} label={`Presença de ${f.nome}`} />
      </TableCell>
    </TableRow>
  );
}
