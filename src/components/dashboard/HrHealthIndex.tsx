import { HeartPulse, ArrowRight } from 'lucide-react';
import type { HealthIndex, MetricStatus } from '@/features/dashboard/types';

const ARC: Record<MetricStatus, string> = {
  positive: '#34d399', info: '#c7a83e', warning: '#fbbf24', critical: '#f87171', neutral: '#94a3b8',
};
const compTone = (score: number): MetricStatus =>
  score >= 80 ? 'positive' : score >= 60 ? 'info' : score >= 40 ? 'warning' : 'critical';
const STATUS_LABEL: Record<MetricStatus, string> = {
  positive: 'Saudável', info: 'Estável', warning: 'Atenção', critical: 'Crítico', neutral: '—',
};

interface HrHealthIndexProps {
  health: HealthIndex;
  onOpen: () => void;
}

/** Card destacado do Índice de Saúde do RH — verde escuro, pontuação grande e arco. */
export function HrHealthIndex({ health, onOpen }: HrHealthIndexProps) {
  const dash = 2 * Math.PI * 34;
  const offset = dash * (1 - health.score / 100);
  const arcColor = ARC[health.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-[0_10px_30px_-18px_rgba(0,40,20,0.6)] ring-1 ring-white/5"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
          <HeartPulse className="h-4 w-4 text-emerald-300" />
          Índice de Saúde do RH
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
          {STATUS_LABEL[health.status]}
        </span>
      </div>

      <div className="relative mt-3 flex items-center gap-4">
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={arcColor} strokeWidth="7" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold leading-none text-white">{health.score}</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">de 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {health.components.map((c) => {
            const tone = c.available ? compTone(c.score) : 'neutral';
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="truncate text-white/60">{c.label}</span>
                  <span className="font-medium text-white/90">{c.available ? Math.round(c.score) : '—'}</span>
                </div>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${c.available ? c.score : 0}%`, backgroundColor: ARC[tone] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-auto flex items-center justify-between pt-4">
        {health.partial
          ? <span className="text-[10px] text-white/45">Score parcial — pesos redistribuídos</span>
          : <span className="text-[10px] text-white/45">Média ponderada dos componentes</span>}
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 group-hover:gap-1.5">
          Detalhar <ArrowRight className="h-3.5 w-3.5 transition-all" />
        </span>
      </div>
    </div>
  );
}
