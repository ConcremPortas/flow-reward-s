import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEFAULT_ROUTE } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { IntroOverlay } from '@/components/IntroOverlay';
import { LoginHero } from '@/components/login/LoginHero';
import { LoginCard } from '@/components/login/LoginCard';

const WALLPAPER = '/logos/walpaper-concrem.png';

const introKey = (idOrEmail: string) => `recompensa_intro_seen_${idOrEmail}`;

// TEMPORARIO (apresentacao): exibir a intro SEMPRE apos o login, ignorando a flag
// do localStorage. Para voltar ao comportamento normal (intro so na 1a vez),
// troque para false.
const INTRO_SEMPRE = true;

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true); // visual apenas
  const [intro, setIntro] = useState<{ key: string; target: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error, profile } = await signIn(email, password);

    if (error) {
      setLoading(false);
      toast({ title: error, variant: 'destructive' });
      return;
    }

    if (profile) {
      const target = DEFAULT_ROUTE[profile.perfil];
      const key = introKey(profile.id ?? profile.email);
      let jaViu = false;
      if (!INTRO_SEMPRE) {
        try {
          jaViu = localStorage.getItem(key) === '1';
        } catch {
          jaViu = false;
        }
      }
      if (jaViu) {
        navigate(target, { replace: true });
      } else {
        setIntro({ key, target });
      }
    } else {
      setLoading(false);
    }
  };

  const handleIntroDone = () => {
    if (intro) {
      try {
        localStorage.setItem(intro.key, '1');
      } catch {
        /* localStorage indisponivel: segue mesmo assim */
      }
      navigate(intro.target, { replace: true });
    }
  };

  if (intro) {
    return <IntroOverlay onDone={handleIntroDone} />;
  }

  return (
    <div className="relative min-h-screen w-full animate-fade-in overflow-hidden">
      {/* Fundo florestal (leve zoom / parallax) */}
      <div
        className="fixed inset-0 animate-slow-zoom bg-cover bg-center"
        style={{ backgroundImage: `url(${WALLPAPER})` }}
      />
      {/* Overlays cinematograficos em camadas (spec): glows radiais verdes + escurecimento
          verde/preto + glow verde inferior + vignette nas bordas. */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 72% 45%, rgba(34,197,94,0.14), transparent 34%),' +
            'radial-gradient(circle at 18% 28%, rgba(16,185,129,0.12), transparent 32%),' +
            'linear-gradient(90deg, rgba(0,20,10,0.58), rgba(0,14,8,0.36), rgba(0,0,0,0.74)),' +
            'linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,40,22,0.5))',
        }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_118%,rgba(34,197,94,0.2),transparent_52%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_52%,rgba(0,0,0,0.5)_100%)]" />

      {/* Decorações verdes (desktop) — arco + glow + pattern de pontos, como na referência */}
      <div className="pointer-events-none fixed inset-0 z-[1] hidden lg:block">
        {/* Arco verde translúcido varrendo o TOPO (grande circulo com centro abaixo do
            viewport, so a curva superior aparece), com glow. */}
        <svg
          className="absolute left-[-450px] top-[100px] h-[1900px] w-[1900px]"
          viewBox="0 0 1900 1900"
          fill="none"
          style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}
        >
          <circle cx="950" cy="950" r="850" stroke="#4ade80" strokeOpacity="0.28" strokeWidth="1.2" />
          <circle cx="950" cy="950" r="770" stroke="#6ee7b7" strokeOpacity="0.1" strokeWidth="0.8" />
        </svg>
        {/* Glow verde + ponto de brilho discreto sobre a curva do arco (topo-centro) */}
        <div className="absolute left-[44%] top-[18%] h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/25 blur-[70px]" />
        <span className="absolute left-[44%] top-[25%] h-3 w-3 -translate-x-1/2 animate-glow-pulse rounded-full bg-emerald-100 shadow-[0_0_34px_9px_rgba(16,185,129,0.85)]" />
        {/* Pattern de pontos (canto inferior esquerdo) */}
        <div
          className="absolute bottom-8 left-8 h-48 w-56 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(52,211,153,0.85) 1.3px, transparent 1.3px)',
            backgroundSize: '18px 18px',
          }}
        />
      </div>

      {/* Conteúdo — container editorial centralizado (não colado nas bordas) */}
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 px-8 sm:px-12 lg:grid-cols-[52fr_48fr] xl:px-16">
          <LoginHero />
          <div className="flex items-center justify-center py-10 lg:justify-end lg:py-0">
            <LoginCard
              email={email}
              password={password}
              showPassword={showPassword}
              remember={remember}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onToggleShowPassword={() => setShowPassword((v) => !v)}
              onRememberChange={setRemember}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>

      {/* Rodapé da tela (discreto) */}
      <div className="pointer-events-none absolute bottom-6 left-0 z-10 w-full">
        <div className="mx-auto max-w-[1440px] px-8 sm:px-12 xl:px-16">
          <p className="text-xs text-white/[0.58]">© {new Date().getFullYear()} Concrem</p>
        </div>
      </div>
    </div>
  );
}
