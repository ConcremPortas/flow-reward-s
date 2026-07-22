import type { LucideIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { MasterKey } from './masterShared';

export interface TabItem { key: MasterKey; label: string; icon: LucideIcon; count: number; pendencias: number }

interface Props { tabs: TabItem[]; active: MasterKey; onChange: (k: MasterKey) => void }

/** Navegação entre cadastros: barra rolável com contagem + indicador de pendência (desktop); seletor (mobile). */
export function MasterDataTabs({ tabs, active, onChange }: Props) {
  return (
    <>
      {/* Mobile: seletor */}
      <div className="sm:hidden">
        <Select value={active} onValueChange={(v) => onChange(v as MasterKey)}>
          <SelectTrigger aria-label="Selecionar cadastro"><SelectValue /></SelectTrigger>
          <SelectContent>
            {tabs.map((t) => (
              <SelectItem key={t.key} value={t.key}>{t.label} · {formatNumberBR(t.count)}{t.pendencias > 0 ? ` · ${t.pendencias} pendência(s)` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop/tablet: abas roláveis */}
      <nav className="hidden gap-1.5 overflow-x-auto pb-0.5 sm:flex" role="tablist" aria-label="Cadastros">
        {tabs.map((t) => {
          const Icon = t.icon; const on = t.key === active;
          return (
            <button
              key={t.key} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.key)}
              className={cn('group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                on ? 'bg-[#08783e] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums', on ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground group-hover:bg-background')}>{formatNumberBR(t.count)}</span>
              {t.pendencias > 0 && <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-status-warning' : 'bg-status-warning')} title={`${t.pendencias} pendência(s)`} aria-label={`${t.pendencias} pendência(s)`} />}
            </button>
          );
        })}
      </nav>
    </>
  );
}
