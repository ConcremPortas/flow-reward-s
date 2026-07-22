import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AuthState } from '../domain/userAuthState';

const CLS: Record<AuthState['kind'], string> = {
  supabase: 'bg-success/10 text-success',
  legado: 'bg-muted text-muted-foreground',
  migracao_pendente: 'bg-status-warning/10 text-status-warning',
  indeterminado: 'bg-muted text-muted-foreground',
};

export function UserAuthStatus({ state }: { state: AuthState }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', CLS[state.kind])}>{state.label}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px]">{state.descricao}</TooltipContent>
    </Tooltip>
  );
}
