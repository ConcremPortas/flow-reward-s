import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEFAULT_ROUTE } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { IntroOverlay } from '@/components/IntroOverlay';
import { LoginHero } from '@/components/login/LoginHero';
import { LoginCard } from '@/components/login/LoginCard';

const WALLPAPER = '/logos/walpaper-concrem.jpg';

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0); // remontar o widget = novo desafio
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  const clearCaptcha = () => setCaptchaToken(null); // expira/erro: só invalida o token
  const resetCaptcha = () => { setCaptchaToken(null); setCaptchaNonce((n) => n + 1); }; // novo desafio (remonta)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!captchaToken) {
      toast({ title: 'Confirme que você não é um robô para continuar.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error, profile } = await signIn(email, password, captchaToken);

    if (error) {
      setLoading(false);
      resetCaptcha(); // token do Turnstile é de uso único
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
    <div className="relative flex min-h-screen w-full animate-fade-in flex-col overflow-hidden bg-[#060d0a] lg:flex-row">
      {/* ── Painel esquerdo (institucional) ─────────────────────────────── */}
      <section className="relative flex w-full flex-col justify-center overflow-hidden px-7 py-14 sm:px-12 lg:w-1/2 lg:px-16 lg:py-16 xl:px-20">
        {/* Fundo florestal escurecido + overlay verde profundo */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${WALLPAPER})`, filter: 'brightness(0.5)' }} aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 62% 42%, rgba(34,197,94,0.14), transparent 40%),' +
              'linear-gradient(115deg, rgba(2,16,10,0.86), rgba(2,20,13,0.72) 55%, rgba(3,26,17,0.6))',
          }}
          aria-hidden
        />
        {/* Pattern de pontos (canto inferior esquerdo) */}
        <div
          className="pointer-events-none absolute bottom-10 left-8 hidden h-40 w-48 opacity-25 lg:block"
          style={{ backgroundImage: 'radial-gradient(rgba(52,211,153,0.8) 1.2px, transparent 1.2px)', backgroundSize: '17px 17px' }}
          aria-hidden
        />
        <LoginHero />
        <p className="pointer-events-none absolute bottom-6 left-7 z-10 text-xs text-white/40 sm:left-12 lg:left-16 xl:left-20">
          © {new Date().getFullYear()} Concrem
        </p>
      </section>

      {/* ── Linha luminosa curva animada (divisão esquerda/direita) ──────── */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px -translate-x-1/2 lg:block" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute left-1/2 top-0 h-full w-64 -translate-x-1/2 animate-login-line-drift motion-reduce:animate-none">
          <div className="absolute left-1/2 top-1/2 h-[70%] w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[80px]" />
          <svg className="absolute left-1/2 top-0 h-full w-64 -translate-x-1/2 overflow-visible" viewBox="0 0 256 900" fill="none" preserveAspectRatio="none">
            <path d="M128 0 C 40 300, 40 600, 128 900" stroke="url(#loginSeam)" strokeWidth="1.3" strokeOpacity="0.6" />
            <defs>
              <linearGradient id="loginSeam" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ade80" stopOpacity="0" />
                <stop offset="0.5" stopColor="#6ee7b7" stopOpacity="0.9" />
                <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── Painel direito (autenticação) ───────────────────────────────── */}
      <section className="relative flex w-full items-center justify-center bg-[#080f0b] px-7 py-14 sm:px-12 lg:w-1/2 lg:px-16 lg:py-16 xl:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(16,185,129,0.06),transparent_60%)]" aria-hidden />
        <LoginCard
          email={email}
          password={password}
          showPassword={showPassword}
          remember={remember}
          loading={loading}
          siteKey={siteKey}
          captchaNonce={captchaNonce}
          captchaReady={!!captchaToken}
          onCaptchaToken={setCaptchaToken}
          onCaptchaExpire={clearCaptcha}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onToggleShowPassword={() => setShowPassword((v) => !v)}
          onRememberChange={setRemember}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
