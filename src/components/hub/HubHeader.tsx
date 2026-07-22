import { LogOut, User } from 'lucide-react';

const LOGO = '/logos/Logo-Branco.png';

interface Props {
  userName: string;
  onLogout: () => void;
}

/**
 * Cabeçalho translúcido do Hub. Identidade Concrem + "Sistema de Gestão
 * Integrada" à esquerda; usuário autenticado + Sair à direita. Usa o nome real
 * recebido por prop (nunca hardcoded).
 */
export function HubHeader({ userName, onLogout }: Props) {
  return (
    <header className="border-b border-white/10 bg-[#08130d]/55 backdrop-blur-xl">
      <div className="mx-auto flex h-[96px] w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 xl:px-12">
        {/* Esquerda: marca + sistema */}
        <div className="flex min-w-0 items-center gap-4">
          <img src={LOGO} alt="Concrem" className="h-10 w-auto shrink-0 object-contain" />
          <span className="hidden h-8 w-px shrink-0 bg-white/15 sm:block" aria-hidden />
          <p className="hidden truncate text-base font-normal text-white/60 sm:block">Sistema de Gestão Integrada</p>
        </div>

        {/* Direita: usuário + sair */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-emerald-500/40 text-emerald-300" aria-hidden>
              <User className="h-5 w-5" />
            </span>
            <span className="hidden max-w-[160px] truncate text-base font-medium text-white sm:block">{userName}</span>
          </div>
          <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair do sistema"
            className="flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/80 transition-colors duration-200 hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
