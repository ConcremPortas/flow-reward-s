import { useEffect, useRef, useState } from 'react';

const WALLPAPER = '/logos/walpaper-concrem.jpg';
const LOGO_BRANCO = '/logos/Logo-Branco.png';

const TITLE = 'Bem-vindo à Gestão RH';
const SUBTITLE = 'Sistema corporativo de gestão e desempenho';
const DURATION = 3000; // ms (duração aproximada da intro)

interface IntroOverlayProps {
  /** Chamado quando a intro termina (por tempo ou skip). O pai navega e desmonta. */
  onDone: () => void;
}

/**
 * Intro animada exibida APENAS após login validado (o Login decide quando montar).
 * Não contém lógica de autenticação. Pula com clique/Esc; encerra sozinha em ~3s.
 */
export function IntroOverlay({ onDone }: IntroOverlayProps) {
  const [typed, setTyped] = useState('');
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  // Encerramento único (tempo ou skip): faz o fade-out e chama onDone.
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 450); // aguarda a transição de saída
  };

  useEffect(() => {
    // Efeito de digitação do título
    let i = 0;
    const typer = window.setInterval(() => {
      i += 1;
      setTyped(TITLE.slice(0, i));
      if (i >= TITLE.length) window.clearInterval(typer);
    }, 55);

    // Barra de progresso preenche em ~DURATION
    const raf = window.requestAnimationFrame(() => setProgress(100));

    // Encerramento automático
    const timer = window.setTimeout(finish, DURATION);

    // Skip técnico: tecla Esc (sem depender de botão visível)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearInterval(typer);
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Pular introdução"
      style={{ transitionDuration: '450ms' }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Fundo + overlay elegante */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${WALLPAPER})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <img
          src={LOGO_BRANCO}
          alt="Concrem"
          className="mb-10 h-16 w-auto animate-scale-in drop-shadow-2xl md:h-20"
        />

        <h1 className="min-h-[1.2em] text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
          {typed}
          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-white align-middle" style={{ height: '0.9em' }} />
        </h1>

        <p className="mt-4 max-w-xl text-base text-white/80 animate-fade-in [animation-delay:900ms] md:text-lg">
          {SUBTITLE}
        </p>

        {/* Barra de progresso */}
        <div className="mt-10 h-[3px] w-56 overflow-hidden rounded-full bg-white/20 md:w-72">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] ease-linear"
            style={{ width: `${progress}%`, transitionDuration: `${DURATION}ms` }}
          />
        </div>

        <p className="mt-6 text-xs uppercase tracking-widest text-white/40">
          toque para pular
        </p>
      </div>
    </div>
  );
}
