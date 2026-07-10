import type { FormEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

interface LoginCardProps {
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onRememberChange: (v: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

const inputCls =
  'h-[56px] w-full rounded-xl border border-white/[0.13] bg-white/[0.055] pl-11 pr-4 text-[15px] text-white placeholder:text-white/40 outline-none transition-all focus:border-emerald-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/25';

/** Card de login (glassmorphism premium). Só visual — lógica vem por props. */
export function LoginCard(props: LoginCardProps) {
  const {
    email, password, showPassword, remember, loading,
    onEmailChange, onPasswordChange, onToggleShowPassword, onRememberChange, onSubmit,
  } = props;

  return (
    <div
      className="w-full max-w-[560px] animate-slide-in-right rounded-[26px] p-8 md:p-11"
      style={{
        background: 'rgba(3,20,12,0.72)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(74,222,128,0.22)',
        boxShadow:
          '0 35px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 55px rgba(34,197,94,0.10)',
      }}
    >
      {/* Badge de segurança */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Acesso seguro</p>
          <p className="text-xs text-white/50">Ambiente corporativo protegido</p>
        </div>
      </div>

      {/* Títulos */}
      <h1 className="text-[28px] font-bold tracking-tight text-white">Acesse a plataforma</h1>
      <p className="mt-1.5 text-sm text-white/55">Entre com suas credenciais para continuar</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              id="email"
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
              className={inputCls}
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Lembrar / Esqueceu */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => onRememberChange(Boolean(v))}
              className="border-white/30 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
            />
            Lembrar meu acesso
          </label>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Esqueceu sua senha?
          </a>
        </div>

        {/* Botão CTA */}
        <button
          type="submit"
          disabled={loading}
          className="group flex h-[58px] w-full items-center justify-center gap-2 rounded-[13px] bg-gradient-to-r from-[#16a34a] to-[#2ecc6b] text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#18b352] hover:to-[#37d977] hover:shadow-[0_16px_44px_rgba(34,197,94,0.45)] disabled:pointer-events-none disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-white/10" />
        <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.15em] text-white/40">
          Ambiente corporativo seguro
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/* Box LGPD */}
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
        <p className="text-xs leading-relaxed text-white/50">
          Seus dados estão protegidos com criptografia de ponta a ponta e conformidade LGPD.
        </p>
      </div>
    </div>
  );
}
