import { Users, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { pluralizeBR } from '@/lib/formatters';
import type { UsersContextCounts } from '../domain/userFilters';

/** Faixa compacta de contexto + alerta de único administrador. */
export function UsersContext({ ctx }: { ctx: UsersContextCounts }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)]">
        <Item icon={Users} label={pluralizeBR(ctx.total, 'usuário', 'usuários')} />
        <Sep />
        <Item icon={CheckCircle2} label={`${ctx.ativos} ${ctx.ativos === 1 ? 'ativo' : 'ativos'}`} tone="positive" />
        {ctx.inativos > 0 && <><Sep /><Item icon={Users} label={`${ctx.inativos} ${ctx.inativos === 1 ? 'inativo' : 'inativos'}`} /></>}
        <Sep />
        <Item icon={ShieldCheck} label={`${pluralizeBR(ctx.administradoresAtivos, 'administrador ativo', 'administradores ativos')}`} tone="gold" />
        {ctx.comPermissaoDesconhecida > 0 && <><Sep /><Item icon={AlertTriangle} label={`${ctx.comPermissaoDesconhecida} com permissão a revisar`} tone="warn" /></>}
      </div>
      {ctx.soUmAdmin && (
        <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <span className="text-foreground">Existe apenas <strong>um administrador ativo</strong>. Ele não pode ser desativado nem rebaixado (proteção de último administrador).</span>
        </div>
      )}
    </div>
  );
}

function Item({ icon: Icon, label, tone }: { icon: typeof Users; label: string; tone?: 'positive' | 'gold' | 'warn' }) {
  const cls = tone === 'positive' ? 'text-success' : tone === 'gold' ? 'text-[#7a5f16]' : tone === 'warn' ? 'text-status-warning' : 'text-foreground';
  return <span className={`inline-flex items-center gap-1.5 ${cls}`}><Icon className="h-4 w-4 text-muted-foreground/70" /> {label}</span>;
}
function Sep() { return <span className="hidden h-4 w-px bg-border/70 sm:inline-block" aria-hidden />; }
