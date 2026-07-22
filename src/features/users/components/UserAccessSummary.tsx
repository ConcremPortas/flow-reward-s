import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { accessSummary } from '../domain/userAccess';
import type { UserAccess } from '../domain/userAccess';

/** Resumo compacto do acesso (sem dezenas de chips). */
export function UserAccessSummary({ access }: { access: UserAccess }) {
  return (
    <div className="flex items-center gap-1.5">
      {access.kind === 'total' && <ShieldCheck className="h-3.5 w-3.5 text-[#7a5f16]" />}
      <span className={access.kind === 'total' ? 'text-sm font-medium text-[#7a5f16]' : 'text-sm text-foreground'}>{accessSummary(access)}</span>
      {access.desconhecidas.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-status-warning"><AlertTriangle className="h-3 w-3" /> {access.desconhecidas.length}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">Permissões não reconhecidas (revisar): {access.desconhecidas.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
