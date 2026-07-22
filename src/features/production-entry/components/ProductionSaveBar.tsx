import { Loader2, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';

interface Props {
  setoresAlterados: number;
  metasAlteradas: number;
  realizadosAlterados: number;
  saving: boolean;
  onDiscard: () => void;
  onReview: () => void;
}

/** Barra sticky de salvamento — só aparece quando há alterações não salvas. */
export function ProductionSaveBar({ setoresAlterados, metasAlteradas, realizadosAlterados, saving, onDiscard, onReview }: Props) {
  if (setoresAlterados === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-status-warning/30 bg-card px-5 py-3.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        <span className="text-sm font-semibold text-foreground">{pluralizeBR(setoresAlterados, 'setor alterado', 'setores alterados')}</span>
      </div>
      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
        <span>{pluralizeBR(metasAlteradas, 'meta alterada', 'metas alteradas')}</span>
        <span>{pluralizeBR(realizadosAlterados, 'produção alterada', 'produções alteradas')}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>Descartar alterações</Button>
        <Button size="sm" className="gap-1.5" onClick={onReview} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
          Revisar alterações
        </Button>
      </div>
    </div>
  );
}
