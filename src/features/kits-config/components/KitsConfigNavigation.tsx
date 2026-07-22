import { cn } from '@/lib/utils';
import { KITS_CONFIG_VIEWS, type KitsConfigView } from '../views';

interface Props { active: KitsConfigView; onChange: (v: KitsConfigView) => void }

export function KitsConfigNavigation({ active, onChange }: Props) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = KITS_CONFIG_VIEWS.findIndex(v => v.key === active);
    if (e.key === 'ArrowRight' && i < KITS_CONFIG_VIEWS.length - 1) { e.preventDefault(); onChange(KITS_CONFIG_VIEWS[i + 1].key); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(KITS_CONFIG_VIEWS[i - 1].key); }
  };
  return (
    <nav role="tablist" aria-label="Visões de configuração de kits" onKeyDown={onKeyDown} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {KITS_CONFIG_VIEWS.map(v => {
        const isActive = v.key === active; const Icon = v.icon;
        return (
          <button key={v.key} type="button" role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1} onClick={() => onChange(v.key)}
            className={cn('inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              isActive ? 'bg-[#08783e] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <Icon className="h-4 w-4" /> {v.label}
          </button>
        );
      })}
    </nav>
  );
}
