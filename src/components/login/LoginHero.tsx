import { BarChart3, Share2, Target } from 'lucide-react';

const LOGO_BRANCO = '/logos/Logo-Branco.png';

const beneficios = [
  { icon: BarChart3, title: 'Gestão Inteligente', text: 'Informações precisas para decisões melhores.' },
  { icon: Share2, title: 'Conexão Estratégica', text: 'Times alinhados, objetivos compartilhados.' },
  { icon: Target, title: 'Performance Real', text: 'Acompanhamento contínuo e resultados consistentes.' },
];

/** Área institucional/marketing do login (coluna esquerda). Apenas visual. */
export function LoginHero() {
  return (
    <div className="relative hidden animate-slide-in-left flex-col justify-center py-16 lg:flex">
      {/* Logo (menor e elegante) */}
      <img src={LOGO_BRANCO} alt="Concrem" className="mb-11 w-[320px] max-w-full object-contain drop-shadow-lg" />

      {/* Headline com barra vertical verde */}
      <div className="relative pl-5">
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-800 shadow-[0_0_14px_rgba(16,185,129,0.55)]" />
        <h1 className="text-[46px] font-bold leading-[1.07] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] xl:text-[52px]">
          A inteligência que
          <br />
          move resultados.
        </h1>
      </div>

      {/* Texto de apoio */}
      <p className="mt-6 max-w-[440px] text-[18px] leading-relaxed text-white/[0.78] drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
        Dados, pessoas e processos conectados para transformar estratégia em performance real.
      </p>

      {/* Benefícios (discretos, refinados, mais baixos) */}
      <div className="mt-16 flex max-w-[640px] gap-5">
        {beneficios.map((b, i) => (
          <div key={b.title} className={i > 0 ? 'flex-1 border-l border-white/10 pl-5' : 'flex-1'}>
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_18px_-3px_rgba(16,185,129,0.4)]">
              <b.icon className="h-[18px] w-[18px]" />
            </div>
            <h3 className="text-[13px] font-semibold text-white">{b.title}</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-white/50">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
