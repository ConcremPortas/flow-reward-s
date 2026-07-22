import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HRApplication } from '@/hooks/useHRApplications';
import { resolveHubIcon } from './hubIcons';

interface Props {
  app: HRApplication;
  hasAccess: boolean;
  onAccess: () => void;
  /** Atraso da animação de entrada (ms). */
  delay?: number;
}

/**
 * Card de módulo do Hub. Estrutura fixa (ícone circular, título, descrição,
 * divisor, botão). Conteúdo alinhado à esquerda; botão fixado ao final via
 * flex. Usa dados reais (nome/descrição/ícone/rota) e respeita a permissão.
 */
export function HubModuleCard({ app, hasAccess, onAccess, delay = 0 }: Props) {
  const Icon = resolveHubIcon(app.icon);
  return (
    <article
      className="group flex animate-fade-in-up flex-col rounded-2xl border border-emerald-500/15 bg-[#06140d]/55 p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-[#081a11]/60 motion-reduce:animate-none motion-reduce:transition-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300" aria-hidden>
        <Icon className="h-8 w-8" />
      </div>

      <h2 className="mt-6 text-[1.4rem] font-semibold leading-tight text-white">{app.name}</h2>
      <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-white/60">{app.description}</p>

      <span className="mt-5 block h-px w-10 bg-emerald-400/30" aria-hidden />

      <button
        type="button"
        onClick={hasAccess ? onAccess : undefined}
        disabled={!hasAccess}
        aria-disabled={!hasAccess}
        aria-label={hasAccess ? `Acessar módulo ${app.name}` : `${app.name} — acesso restrito`}
        title={hasAccess ? undefined : 'Acesso restrito'}
        className={cn(
          'relative mt-5 flex h-[52px] w-full items-center justify-center rounded-lg text-[14px] font-medium text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70',
          hasAccess
            ? 'bg-gradient-to-b from-[#1a8f4a] to-[#127a3c] hover:from-[#1e9d52] hover:to-[#158643]'
            : 'cursor-not-allowed bg-emerald-900/40 text-white/40',
        )}
      >
        <span>Acessar módulo</span>
        <ArrowRight className="absolute right-5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </button>
    </article>
  );
}
