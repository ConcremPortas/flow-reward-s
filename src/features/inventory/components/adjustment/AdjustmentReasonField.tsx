import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MOTIVOS_AJUSTE } from '../../hooks/useStockAdjustment';

const NENHUM = '__nenhum__';

interface Props {
  tipo: string; desc: string; max: number; valido: boolean; mostrarErro: boolean;
  onTipo: (v: string) => void; onDesc: (v: string) => void;
}

export function AdjustmentReasonField({ tipo, desc, max, valido, mostrarErro, onTipo, onDesc }: Props) {
  const len = desc.trim().length;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Motivo principal</Label>
        <Select value={tipo || NENHUM} onValueChange={(v) => onTipo(v === NENHUM ? '' : v)}>
          <SelectTrigger className="h-9" aria-label="Motivo principal"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUM}>Não especificar</SelectItem>
            {MOTIVOS_AJUSTE.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="motivo-desc" className="text-sm">Descrição do motivo *</Label>
        <Textarea id="motivo-desc" rows={3} value={desc} maxLength={max} onChange={(e) => onDesc(e.target.value)}
          placeholder="Ex.: contagem de inventário mensal; 3 peças danificadas descartadas; correção de lançamento da NF 123..."
          aria-invalid={mostrarErro && !valido} aria-describedby="motivo-ajuda" />
        <div id="motivo-ajuda" className="flex items-center justify-between text-xs">
          <span className={cn(mostrarErro && !valido ? 'text-destructive' : 'text-muted-foreground')}>
            {mostrarErro && !valido ? 'Descreva o motivo (mínimo 5 caracteres).' : 'Este motivo ficará registrado na auditoria.'}
          </span>
          <span className="tabular-nums text-muted-foreground">{len}/{max}</span>
        </div>
      </div>
    </div>
  );
}
