import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ExecutiveHeroProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Ações/CTAs à direita */
  actions?: ReactNode;
  className?: string;
}

/**
 * Hero executivo para o topo das telas de comando (dashboard, geração).
 * Fundo verde premium com glow — só apresentação.
 */
export function ExecutiveHero({ icon: Icon, eyebrow, title, subtitle, actions, className }: ExecutiveHeroProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(150_55%_20%)] px-6 py-7 text-primary-foreground shadow-[var(--shadow-card)] sm:px-8',
        className,
      )}
    >
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">{eyebrow}</p>
            )}
            <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/80">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
