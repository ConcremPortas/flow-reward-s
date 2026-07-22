import type { FormEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginCardProps {
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
  loading: boolean;
  siteKey?: string;
  captchaNonce: number;
  captchaReady: boolean;
  onCaptchaToken: (t: string) => void;
  onCaptchaExpire: () => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onRememberChange: (v: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

const inputCls =
  'h-[60px] w-full rounded-xl border border-white/[0.12] bg-white/[0.04] pl-12 pr-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-all focus:border-emerald-400/55 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/25';

/**
 * Formulário de autenticação (coluna direita) integrado ao layout — não é um
 * card flutuante. Apenas apresentação; a lógica real de login vem por props
 * (preserva signIn/remember/mostrar senha do orquestrador).
 */
export function LoginCard(props: LoginCardProps) {
  const {
    email, password, showPassword, remember, loading,
    siteKey, captchaNonce, captchaReady, onCaptchaToken, onCaptchaExpire,
    onEmailChange, onPasswordChange, onToggleShowPassword, onRememberChange, onSubmit,
  } = props;

  return (
    <div className="w-full max-w-[540px] animate-slide-in-right motion-reduce:animate-none">
      {/* Selo de segurança */}
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-6px_rgba(16,185,129,0.6)]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-white">Acesso seguro</p>
          <p className="text-[13px] text-white/50">Ambiente corporativo protegido</p>
        </div>
      </div>

      {/* Títulos */}
      <h2 className="mt-10 text-[34px] font-bold tracking-tight text-white">Entrar na plataforma</h2>
      <p className="mt-2 text-[15px] text-white/55">Informe suas credenciais para continuar.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-[15px] font-semibold text-white">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" />
            <input
              id="email" type="email" placeholder="seu@email.com.br" value={email}
              onChange={(e) => onEmailChange(e.target.value)} autoComplete="email" disabled={loading} required
              className={inputCls}
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-[15px] font-semibold text-white">Senha</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" />
            <input
              id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••" value={password}
              onChange={(e) => onPasswordChange(e.target.value)} autoComplete="current-password" disabled={loading} required
              className={`${inputCls} pr-12`}
            />
            <button
              type="button" onClick={onToggleShowPassword} tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Lembrar / Esqueceu */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-white/75">
            <Checkbox
              checked={remember} onCheckedChange={(v) => onRememberChange(Boolean(v))}
              className="h-5 w-5 border-white/30 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
            />
            Lembrar meu acesso
          </label>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[14px] font-medium text-emerald-400 transition-colors hover:text-emerald-300">
            Esqueceu sua senha?
          </a>
        </div>

        {/* Verificação de segurança (Cloudflare Turnstile) */}
        {siteKey ? (
          <div className="flex justify-center pt-1">
            <TurnstileWidget key={captchaNonce} siteKey={siteKey} theme="dark" onToken={onCaptchaToken} onExpire={onCaptchaExpire} onError={onCaptchaExpire} />
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200/80">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Verificação de segurança não configurada (defina VITE_TURNSTILE_SITE_KEY).
          </div>
        )}

        {/* CTA */}
        <button
          type="submit" disabled={loading || (!!siteKey && !captchaReady)}
          className="group relative flex h-[64px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-[16px] font-semibold text-white shadow-[0_14px_36px_-10px_rgba(34,197,94,0.55)] transition-all duration-200 hover:from-[#28cf66] hover:to-[#18ac48] hover:shadow-[0_18px_46px_-10px_rgba(34,197,94,0.7)] disabled:pointer-events-none disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Entrando...</>
          ) : (
            <>Entrar <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </button>
      </form>

      {/* Rodapé de segurança */}
      <div className="mt-9 border-t border-white/[0.08] pt-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white/45" />
          <p className="text-[13.5px] leading-relaxed text-white/50">
            Seus dados estão protegidos com criptografia e em conformidade com a LGPD.
          </p>
        </div>
      </div>
    </div>
  );
}
