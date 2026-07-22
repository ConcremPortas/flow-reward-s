import { useEffect, useRef, useState } from 'react';
import { Leaf, Lock, BarChart3, Users } from 'lucide-react';

const WALLPAPER = '/logos/walpaper-concrem.jpg';
const LOGO_BRANCO = '/logos/Logo-Branco.png';

const TITLE = 'Carregando experiência corporativa';
const SUBTITLE = 'Aguarde enquanto preparamos seu acesso';
const DURATION = 3200; // ms — duração da intro

const CHIPS = [
  { id: 'seg', label: 'Segurança', icon: Lock, at: 22 },
  { id: 'ind', label: 'Indicadores', icon: BarChart3, at: 58 },
  { id: 'mod', label: 'Módulos RH', icon: Users, at: 90 },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface IntroOverlayProps {
  /** Chamado quando a intro termina (por tempo ou skip). O pai navega e desmonta. */
  onDone: () => void;
}

/**
 * Intro/loading exibida APENAS após login validado (o Login decide quando montar).
 * Sem lógica de autenticação. Progresso animado por requestAnimationFrame (dirige
 * o percentual e os selos de status). Pula com clique/Esc/Enter/Espaço; encerra
 * sozinha ao concluir. Mesma identidade do login/hub aprovados.
 */
export function IntroOverlay({ onDone }: IntroOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setLeaving(true);
      window.setTimeout(onDone, 450);
    };

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let start: number | null = null;
    let rafId = 0;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(100, easeOutCubic(elapsed / DURATION) * 100);
      setProgress(pct);
      if (elapsed < DURATION) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(finish, 250);
      }
    };

    if (reduceMotion) {
      setProgress(100);
      window.setTimeout(finish, 600);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 450);
  };

  const pctLabel = Math.round(progress);

  return (
    <div
      onClick={skip}
      role="button"
      tabIndex={0}
      aria-label="Pular introdução"
      style={{ transitionDuration: '450ms' }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#060d0a] transition-opacity ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Fundo florestal + overlays */}
      <div className="absolute inset-0 animate-slow-zoom bg-cover bg-center motion-reduce:animate-none" style={{ backgroundImage: `url(${WALLPAPER})`, filter: 'brightness(0.55)' }} aria-hidden />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(34,197,94,0.12), transparent 45%),' +
            'linear-gradient(180deg, rgba(3,14,9,0.82), rgba(2,12,8,0.7) 45%, rgba(2,16,10,0.9))',
        }}
        aria-hidden
      />

      {/* Onda/mesh verde discreta na base */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 overflow-hidden" aria-hidden>
        <div className="absolute bottom-6 left-0 h-40 w-full animate-login-line-drift motion-reduce:animate-none">
          <svg className="h-full w-full" viewBox="0 0 1600 300" fill="none" preserveAspectRatio="none">
            <path d="M0 210 C 300 120, 620 250, 900 170 S 1400 90, 1600 180" stroke="url(#introWave)" strokeWidth="1.2" strokeOpacity="0.55" />
            <path d="M0 250 C 340 170, 640 290, 960 210 S 1420 150, 1600 230" stroke="url(#introWave)" strokeWidth="1" strokeOpacity="0.3" />
            <defs>
              <linearGradient id="introWave" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" stopOpacity="0" />
                <stop offset="0.5" stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="1" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center px-6 text-center">
        {/* Marca */}
        <img src={LOGO_BRANCO} alt="Concrem" className="h-14 w-auto animate-fade-in drop-shadow-2xl md:h-[68px]" />
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.32em] text-white/55 animate-fade-in [animation-delay:150ms] md:text-xs">
          Sistema de Gestão Integrada
        </p>
        <span className="mt-4 block h-0.5 w-16 rounded-full bg-emerald-400/80 animate-fade-in [animation-delay:250ms]" aria-hidden />

        {/* Painel de carregamento */}
        <div className="mt-10 w-full animate-fade-in-up rounded-2xl border border-emerald-500/15 bg-black/25 px-6 py-8 backdrop-blur-md sm:px-10 sm:py-9 [animation-delay:350ms]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-400 shadow-[0_0_22px_-6px_rgba(16,185,129,0.6)]" aria-hidden>
            <Leaf className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">{TITLE}</h1>
          <p className="mt-1.5 text-sm text-white/55 sm:text-[15px]">{SUBTITLE}</p>

          {/* Barra de progresso + percentual */}
          <div className="mt-7 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={pctLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do carregamento"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-emerald-400">{pctLabel}%</span>
          </div>

          {/* Selos de status */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {CHIPS.map((c) => {
              const active = progress >= c.at;
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${
                    active ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-white/55'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-white/45'}`} aria-hidden />
                  <span>{c.label}</span>
                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      active ? 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)]' : 'bg-white/25'
                    }`}
                    aria-hidden
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
