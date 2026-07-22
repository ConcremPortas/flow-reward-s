import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { cn } from '@/lib/utils';

const initialsOf = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface Props {
  funcionario: Funcionario;
  conforme: boolean;
  changed: boolean;
  onChange: (conforme: boolean) => void;
}

/** Card de funcionário para mobile — controle Conforme/Não conforme grande. */
export function EpiInspectionCard({ funcionario: f, conforme, changed, onChange }: Props) {
  return (
    <div className={cn('rounded-xl border border-border/70 bg-card p-4', changed && 'border-status-warning/40 bg-status-warning/[0.03]')}>
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(f.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{f.nome}</p>
          <p className="text-xs text-muted-foreground">{f.setor?.nome || 'Sem setor'}{f.funcao?.nome ? ` · ${f.funcao.nome}` : ''}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={conforme}
          onClick={() => onChange(true)}
          className={cn('h-11 rounded-lg text-sm font-semibold transition-colors', conforme ? 'bg-success text-white' : 'bg-muted text-muted-foreground')}
        >
          Conforme
        </button>
        <button
          type="button"
          aria-pressed={!conforme}
          onClick={() => onChange(false)}
          className={cn('h-11 rounded-lg text-sm font-semibold transition-colors', !conforme ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground')}
        >
          Não conforme
        </button>
      </div>
    </div>
  );
}
