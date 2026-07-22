import { Shield, BarChart3, Users } from 'lucide-react';

const LOGO_BRANCO = '/logos/Logo-Branco.png';

const beneficios = [
  { icon: Shield, title: 'Ambiente seguro', text: 'Proteção avançada de dados e conformidade LGPD.' },
  { icon: BarChart3, title: 'Gestão integrada', text: 'Módulos conectados para uma visão completa do negócio.' },
  { icon: Users, title: 'Performance real', text: 'Indicadores que transformam dados em resultados.' },
];

/**
 * Painel institucional (coluna esquerda). Logo, título com destaque verde,
 * linha animada sob o título (limitada à largura da frase), parágrafo e três
 * blocos informativos. Apenas apresentação.
 */
export function LoginHero() {
  return (
    <div className="relative z-10 flex animate-slide-in-left flex-col motion-reduce:animate-none">
      {/* Marca */}
      <img src={LOGO_BRANCO} alt="Concrem" className="mb-12 w-[240px] max-w-full object-contain drop-shadow-lg sm:w-[280px]" />

      {/* Título + linha animada (largura = largura do título) */}
      <div className="inline-block self-start">
        <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-[52px]">
          Acesso corporativo
          <br />
          <span className="text-emerald-400">inteligente.</span>
        </h1>
        <div className="relative mt-7 h-[3px] w-full overflow-hidden rounded-full bg-emerald-500/15">
          <span className="absolute top-0 h-full w-12 animate-login-underline rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)] motion-reduce:animate-none" />
        </div>
      </div>

      {/* Parágrafo institucional */}
      <p className="mt-8 max-w-[460px] text-[17px] leading-relaxed text-white/70 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
        Gestão integrada para decisões mais rápidas, conexões mais inteligentes e resultados que movimentam o futuro da sua empresa.
      </p>

      {/* Blocos informativos */}
      <div className="mt-12 flex max-w-[480px] flex-col gap-7">
        {beneficios.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-400 shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]">
              <b.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white">{b.title}</h3>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-white/55">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
