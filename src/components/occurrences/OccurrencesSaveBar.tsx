import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  changedCount: number;
  totalFaltasDelta: number;
  totalAdvertenciasDelta: number;
  saving: boolean;
  onDiscard: () => void;
  onReview: () => void;
  onSave: () => void;
}

const fmtDelta = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Barra sticky de salvamento — só aparece quando há alterações não salvas. */
export function OccurrencesSaveBar({ changedCount, totalFaltasDelta, totalAdvertenciasDelta, saving, onDiscard, onReview, onSave }: Props) {
  if (changedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-status-warning/30 bg-card px-5 py-3.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        <span className="text-sm font-semibold text-foreground">{changedCount} funcionário(s) alterado(s)</span>
      </div>
      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
        <span>Faltas: <b className="text-foreground">{fmtDelta(totalFaltasDelta)}</b></span>
        <span>Advertências: <b className="text-foreground">{fmtDelta(totalAdvertenciasDelta)}</b></span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>Descartar</Button>
        <Button variant="outline" size="sm" onClick={onReview} disabled={saving}>Revisar</Button>
        <Button size="sm" className="gap-1.5" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar apuração'}
        </Button>
      </div>
    </div>
  );
}
