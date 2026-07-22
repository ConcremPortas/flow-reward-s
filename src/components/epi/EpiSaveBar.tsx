import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  changedCount: number;
  conformes: number;
  naoConformes: number;
  onDiscard: () => void;
  onReview: () => void;
}

/**
 * Barra sticky de alterações — visível mesmo com centenas de linhas na
 * tabela. A ação de salvar em si fica na Revisão (Etapa 3), onde há contexto
 * completo antes de confirmar.
 */
export function EpiSaveBar({ changedCount, conformes, naoConformes, onDiscard, onReview }: Props) {
  if (changedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-status-warning/30 bg-card px-5 py-3.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-warning" />
        <span className="text-sm font-semibold text-foreground">{changedCount} funcionário(s) alterado(s)</span>
      </div>
      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
        <span>Conformes: <b className="text-foreground">{conformes}</b></span>
        <span>Não conformes: <b className="text-foreground">{naoConformes}</b></span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard}>Descartar</Button>
        <Button size="sm" className="gap-1.5" onClick={onReview}>
          <ClipboardCheck className="h-4 w-4" /> Revisar
        </Button>
      </div>
    </div>
  );
}
